const { prisma } = require("../../../utils/prisma_client.js");

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371.2;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const GET = async (req, res) => {
  try {
    const now = new Date();
    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) return res.status(404).json({ error: "Job not found." });

    const role = req.auth.role;
    const { lat, lon } = req.query;

    if (role !== "regular" && role !== "business") {
      return res.status(403).json({ error: "Forbidden." });
    }

    if (role === "business" && (lat !== undefined || lon !== undefined)) {
      return res
        .status(400)
        .json({ error: "Businesses cannot specify lat or lon." });
    }

    let parsedLat, parsedLon;
    if (lat !== undefined || lon !== undefined) {
      if (lat === undefined || lon === undefined) {
        return res
          .status(400)
          .json({ error: "lat and lon must both be specified." });
      }
      parsedLat = parseFloat(lat);
      parsedLon = parseFloat(lon);
      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        return res.status(400).json({ error: "lat and lon must be numbers." });
      }
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        positionType: { select: { id: true, name: true } },
        business: {
          select: {
            id: true,
            business_name: true,
            locationLat: true,
            locationLon: true,
          },
        },
        filledByUser: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    if (!job) return res.status(404).json({ error: "Job not found." });

    if (role === "business") {
      if (job.businessId !== req.auth.id) {
        return res.status(404).json({ error: "Job not found." });
      }
    }

    if (role === "regular") {
      const isOpen = job.status === "open";
      const isTheirs =
        job.filledByUserId === req.auth.id &&
        ["filled", "canceled", "completed"].includes(job.status);

      if (!isOpen && !isTheirs) {
        return res.status(404).json({ error: "Job not found." });
      }

      if (isOpen) {
        const qualification = await prisma.qualification.findUnique({
          where: {
            userId_positionTypeId: {
              userId: req.auth.id,
              positionTypeId: job.positionTypeId,
            },
          },
        });
        if (!qualification || qualification.status !== "approved") {
          return res
            .status(403)
            .json({ error: "You are not qualified for this job." });
        }
      }
    }

    const response = {
      id: job.id,
      status: job.status,
      position_type: { id: job.positionType.id, name: job.positionType.name },
      business: {
        id: job.business.id,
        business_name: job.business.business_name,
      },
      worker: job.filledByUser
        ? {
            id: job.filledByUser.id,
            first_name: job.filledByUser.first_name,
            last_name: job.filledByUser.last_name,
          }
        : null,
      note: job.note,
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      start_time: job.startTime,
      end_time: job.endTime,
      updatedAt: job.updatedAt,
    };

    if (parsedLat !== undefined && parsedLon !== undefined) {
      const distance =
        job.business.locationLat != null && job.business.locationLon != null
          ? haversine(
              parsedLat,
              parsedLon,
              job.business.locationLat,
              job.business.locationLon,
            )
          : null;
      response.distance =
        distance !== null ? Math.round(distance * 10) / 10 : null;
      response.eta =
        distance !== null ? Math.round((distance / 30) * 60) : null;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("GET /jobs/:jobId error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
