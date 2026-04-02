const { prisma } = require("../../../../utils/prisma_client.js");

const GET = async (req, res) => {
  try {
    const pageNum = req.query.page ? parseInt(req.query.page) : 1;
    const limitNum = req.query.limit ? parseInt(req.query.limit) : 10;
    if (isNaN(pageNum) || pageNum < 1)
      return res.status(400).json({ error: "Invalid page." });
    if (isNaN(limitNum) || limitNum < 1)
      return res.status(400).json({ error: "Invalid limit." });

    const where = {
      userId: req.auth.id,
      candidateInterested: true,
    };

    const [count, interests] = await Promise.all([
      prisma.interest.count({ where }),
      prisma.interest.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
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
      },
    }));

    return res.status(200).json({ count, results });
  } catch (error) {
    console.error("GET /users/me/interests error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
