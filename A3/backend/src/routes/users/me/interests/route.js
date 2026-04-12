const { prisma } = require("../../../../utils/prisma_client.js");

function parsePositiveInt(value, label) {
  if (value === undefined) return undefined;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    const error = new Error(`Invalid ${label}.`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

const GET = async (req, res) => {
  try {
    const pageNum = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limitNum = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    if (Number.isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page." });
    }
    if (Number.isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: "Invalid limit." });
    }

    const positionTypeId = parsePositiveInt(req.query.position_type_id, "position_type_id");
    const businessId = parsePositiveInt(req.query.business_id, "business_id");
    const mutual = req.query.mutual;
    const jobStatus = req.query.status;

    const where = {
      userId: req.auth.id,
      candidateInterested: true,
      job: {},
    };

    if (positionTypeId) {
      where.job.positionTypeId = positionTypeId;
    }

    if (businessId) {
      where.job.businessId = businessId;
    }

    if (jobStatus && jobStatus !== "all") {
      where.job.status = jobStatus;
    }

    if (mutual === "true") {
      where.businessInterested = true;
    } else if (mutual === "false") {
      where.businessInterested = { not: true };
    }

    if (Object.keys(where.job).length === 0) {
      delete where.job;
    }

    const [count, interests] = await Promise.all([
      prisma.interest.count({ where }),
      prisma.interest.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          job: {
            include: {
              positionType: { select: { id: true, name: true } },
              business: { select: { id: true, business_name: true } },
            },
          },
        },
      }),
    ]);

    const results = interests.map((interest) => ({
      interest_id: interest.id,
      mutual:
        interest.candidateInterested === true &&
        interest.businessInterested === true,
      job: {
        id: interest.job.id,
        status: interest.job.status,
        position_type: {
          id: interest.job.positionType.id,
          name: interest.job.positionType.name,
        },
        business: {
          id: interest.job.business.id,
          business_name: interest.job.business.business_name,
        },
        salary_min: interest.job.salaryMin,
        salary_max: interest.job.salaryMax,
        start_time: interest.job.startTime,
        end_time: interest.job.endTime,
        updatedAt: interest.job.updatedAt,
        note: interest.job.note,
      },
    }));

    return res.status(200).json({ count, results });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("GET /users/me/interests error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };