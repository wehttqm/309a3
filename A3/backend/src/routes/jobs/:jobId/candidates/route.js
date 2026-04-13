const { prisma } = require("../../../../utils/prisma_client.js");
const { isDiscoverable } = require("../../../../utils/is_discoverable.js");


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

    if (job.status !== "open") {
      return res.status(200).json({ count: 0, results: [] });
    }

    // Fetch system availability timeout
    const availabilityTimeoutSetting = await prisma.systemSetting.findUnique({
      where: { key: "availability-timeout" },
    });
    const availabilityTimeoutMs =
      Number(availabilityTimeoutSetting.value) * 1000;
    const cutoff = new Date(now.getTime() - availabilityTimeoutMs);

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
        qualifications: {
          where: {
            positionTypeId: job.positionTypeId,
            status: "approved",
          },
        },
        filledJobs: {
          where: {
            status: "filled",
          },
        },
        interests: {
          where: { jobId },
        },
      },
    });

    const discoverableCandidates = candidates.filter((user) =>
      isDiscoverable(user, now, availabilityTimeoutMs, {
        positionTypeId: job.positionTypeId,
        jobStartTime: job.startTime,
        jobEndTime: job.endTime,
      }),
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
      avatar: user.avatar,
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
