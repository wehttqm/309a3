const { prisma } = require("../../../../utils/prisma_client.js");

const GET = async (req, res) => {
  try {
    const pageNum = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limitNum = req.query.limit ? parseInt(req.query.limit, 10) : 10;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page." });
    }

    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: "Invalid limit." });
    }

    const where = {
      filledByUserId: req.auth.id,
      status: { in: ["filled", "canceled", "completed"] },
    };

    const [count, jobs] = await Promise.all([
      prisma.jobPosting.count({ where }),
      prisma.jobPosting.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: [{ startTime: "desc" }, { updatedAt: "desc" }],
        include: {
          positionType: { select: { id: true, name: true } },
          business: { select: { id: true, business_name: true } },
        },
      }),
    ]);

    const results = jobs.map((job) => ({
      id: job.id,
      status: job.status,
      position_type: {
        id: job.positionType.id,
        name: job.positionType.name,
      },
      business: {
        id: job.business.id,
        business_name: job.business.business_name,
      },
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      start_time: job.startTime,
      end_time: job.endTime,
      updatedAt: job.updatedAt,
      note: job.note,
    }));

    return res.status(200).json({ count, results });
  } catch (error) {
    console.error("GET /users/me/jobs error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
