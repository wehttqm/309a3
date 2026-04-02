const { prisma } = require("../../utils/prisma_client.js");

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
    const {
      lat,
      lon,
      position_type_id,
      business_id,
      sort,
      order,
      page,
      limit,
    } = req.query;

    // Validate sort
    const validSorts = [
      "updatedAt",
      "start_time",
      "salary_min",
      "salary_max",
      "distance",
      "eta",
    ];
    const sortField = sort ?? "start_time";
    if (!validSorts.includes(sortField)) {
      return res.status(400).json({ error: "Invalid sort field." });
    }

    const validOrders = ["asc", "desc"];
    const sortOrder = order ?? "asc";
    if (!validOrders.includes(sortOrder)) {
      return res.status(400).json({ error: "Invalid order." });
    }

    if (
      ["distance", "eta"].includes(sortField) &&
      (lat === undefined || lon === undefined)
    ) {
      return res.status(400).json({
        error: "lat and lon are required when sorting by distance or eta.",
      });
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

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    if (isNaN(pageNum) || pageNum < 1)
      return res.status(400).json({ error: "Invalid page." });
    if (isNaN(limitNum) || limitNum < 1)
      return res.status(400).json({ error: "Invalid limit." });

    if (position_type_id !== undefined && isNaN(parseInt(position_type_id))) {
      return res.status(400).json({ error: "Invalid position_type_id." });
    }
    if (business_id !== undefined && isNaN(parseInt(business_id))) {
      return res.status(400).json({ error: "Invalid business_id." });
    }

    const userQualifications = await prisma.qualification.findMany({
      where: { userId: req.auth.id, status: "approved" },
      select: { positionTypeId: true },
    });
    const qualifiedPositionTypeIds = userQualifications.map(
      (q) => q.positionTypeId,
    );

    const where = {
      status: "open",
      positionTypeId: { in: qualifiedPositionTypeIds },
      ...(business_id && { businessId: parseInt(business_id) }),
    };

    const negotiationWindowSetting = await prisma.systemSetting.findUnique({
      where: { key: "negotiation-window" },
    });
    const negotiationWindowSeconds = Number(negotiationWindowSetting.value);

    const jobs = await prisma.jobPosting.findMany({
      where,
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
      },
    });

    const validJobs = jobs.filter((job) => {
      const latestNegotiationStart = new Date(
        job.startTime.getTime() - negotiationWindowSeconds * 1000,
      );
      return now <= latestNegotiationStart;
    });

    const count = validJobs.length;

    let jobsWithDistance = validJobs.map((job) => {
      const base = {
        id: job.id,
        status: job.status,
        position_type: { id: job.positionType.id, name: job.positionType.name },
        business: {
          id: job.business.id,
          business_name: job.business.business_name,
        },
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
        base.distance =
          distance !== null ? Math.round(distance * 10) / 10 : null;
        base.eta = distance !== null ? Math.round((distance / 30) * 60) : null;
      }

      return base;
    });

    jobsWithDistance.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "start_time":
          aVal = new Date(a.start_time);
          bVal = new Date(b.start_time);
          break;
        case "updatedAt":
          aVal = new Date(a.updatedAt);
          bVal = new Date(b.updatedAt);
          break;
        case "salary_min":
          aVal = a.salary_min;
          bVal = b.salary_min;
          break;
        case "salary_max":
          aVal = a.salary_max;
          bVal = b.salary_max;
          break;
        case "distance":
          aVal = a.distance;
          bVal = b.distance;
          break;
        case "eta":
          aVal = a.eta;
          bVal = b.eta;
          break;
        default:
          aVal = new Date(a.start_time);
          bVal = new Date(b.start_time);
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const paginated = jobsWithDistance.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum,
    );

    return res.status(200).json({ count, results: paginated });
  } catch (error) {
    console.error("GET /jobs error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
