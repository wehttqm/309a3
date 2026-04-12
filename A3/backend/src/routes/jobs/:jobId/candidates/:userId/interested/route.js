const { prisma } = require("../../../../../../utils/prisma_client.js");
const {
  isDiscoverable,
} = require("../../../../../../utils/is_discoverable.js");

const PATCH = async (req, res) => {
  try {
    const now = new Date();
    const jobId = parseInt(req.params.jobId);
    const userId = parseInt(req.params.userId);
    if (isNaN(jobId) || isNaN(userId))
      return res.status(404).json({ error: "Not found." });

    const { interested } = req.body;
    if (interested === undefined || typeof interested !== "boolean") {
      return res.status(400).json({ error: "interested must be a boolean." });
    }

    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job || job.businessId !== req.auth.id) {
      return res.status(404).json({ error: "Job not found." });
    }

    if (job.status !== "open") {
      return res.status(409).json({ error: "Job is not open." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        qualifications: { where: { positionTypeId: job.positionTypeId } },
        filledJobs: {
          where: {
            status: "filled",
            startTime: { lte: job.endTime },
            endTime: { gte: job.startTime },
          },
        },
      },
    });

    if (!user || user.role !== "regular") {
      return res.status(404).json({ error: "User not found." });
    }

    // Check discoverability
    const availabilityTimeoutSetting = await prisma.systemSetting.findUnique({
      where: { key: "availability-timeout" },
    });
    const availabilityTimeoutMs =
      Number(availabilityTimeoutSetting.value) * 1000;

    if (!isDiscoverable(user, now, availabilityTimeoutMs, {
      positionTypeId: job.positionTypeId,
      jobStartTime: job.startTime,
      jobEndTime: job.endTime,
    })) {
      return res.status(403).json({ error: "User is no longer discoverable." });
    }

    // Find existing interest
    const existingInterest = await prisma.interest.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });

    if (
      !interested &&
      (!existingInterest || existingInterest.businessInterested !== true)
    ) {
      return res
        .status(400)
        .json({ error: "No existing invitation to withdraw." });
    }

    let interest;
    if (existingInterest) {
      interest = await prisma.interest.update({
        where: { userId_jobId: { userId, jobId } },
        data: { businessInterested: interested ? true : null },
      });
    } else {
      interest = await prisma.interest.create({
        data: {
          userId,
          jobId,
          candidateInterested: null,
          businessInterested: true,
        },
      });
    }

    return res.status(200).json({
      id: interest.id,
      job_id: interest.jobId,
      candidate: {
        id: userId,
        interested: interest.candidateInterested,
      },
      business: {
        id: req.auth.id,
        interested: interest.businessInterested,
      },
    });
  } catch (error) {
    console.error(
      "PATCH /jobs/:jobId/candidates/:userId/interested error:",
      error,
    );
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
