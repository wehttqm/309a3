const { prisma } = require("../../../../utils/prisma_client.js");

const GET = async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) return res.status(404).json({ error: "Job not found." });

    const pageNum = req.query.page ? parseInt(req.query.page) : 1;
    const limitNum = req.query.limit ? parseInt(req.query.limit) : 10;
    if (isNaN(pageNum) || pageNum < 1)
      return res.status(400).json({ error: "Invalid page." });
    if (isNaN(limitNum) || limitNum < 1)
      return res.status(400).json({ error: "Invalid limit." });

    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });

    if (!job || job.businessId !== req.auth.id) {
      return res.status(404).json({ error: "Job not found." });
    }

    const where = {
      jobId,
      candidateInterested: true,
    };

    const [count, interests] = await Promise.all([
      prisma.interest.count({ where }),
      prisma.interest.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
        },
      }),
    ]);

    const results = interests.map((interest) => ({
      interest_id: interest.id,
      mutual:
        interest.candidateInterested === true &&
        interest.businessInterested === true,
      user: {
        id: interest.user.id,
        first_name: interest.user.first_name,
        last_name: interest.user.last_name,
      },
    }));

    return res.status(200).json({ count, results });
  } catch (error) {
    console.error("GET /jobs/:jobId/interests error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
