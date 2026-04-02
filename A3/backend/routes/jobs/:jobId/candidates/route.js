const { prisma } = require("../../../../utils/prisma_client.js");

const GET = async (req, res) => {
  try {
    const now = new Date();
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

    // Fetch system availability timeout
    const availabilityTimeoutSetting = await prisma.systemSetting.findUnique({
      where: { key: "availability-timeout" },
    });
    const availabilityTimeoutMs =
      Number(availabilityTimeoutSetting.value) * 1000;
    const cutoff = new Date(now.getTime() - availabilityTimeoutMs);

    // Get all qualified, activated, non-suspended, available, recently active users
    const candidates = await prisma.user.findMany({
      where: {
        role: "regular",
        activated: true,
        suspended: false,
        available: true,
        lastActive: { gte: cutoff },
        qualifications: {
          some: {
            positionTypeId: job.positionTypeId,
            status: "approved",
          },
        },
      },
      include: {
        filledJobs: {
          where: {
            status: "filled",
            startTime: { lte: job.endTime },
            endTime: { gte: job.startTime },
          },
        },
        interests: {
          where: { jobId },
        },
      },
    });

    // Filter out users committed to a conflicting job
    const discoverableCandidates = candidates.filter(
      (user) => user.filledJobs.length === 0,
    );

    const count = discoverableCandidates.length;

    // Paginate in JS since we filtered in JS
    const paginated = discoverableCandidates.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum,
    );

    const results = paginated.map((user) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      invited:
        user.interests.length > 0 &&
        user.interests[0].businessInterested === true,
    }));

    return res.status(200).json({ count, results });
  } catch (error) {
    console.error("GET /jobs/:jobId/candidates error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
