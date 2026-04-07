const { prisma } = require("../../../../utils/prisma_client.js");

const PATCH = async (req, res) => {
  try {
    const now = new Date();
    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) return res.status(404).json({ error: "Job not found." });

    const { interested } = req.body;

    if (interested === undefined || typeof interested !== "boolean") {
      return res.status(400).json({ error: "interested must be a boolean." });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: { business: { select: { id: true } } },
    });

    if (!job) return res.status(404).json({ error: "Job not found." });

    if (job.status !== "open") {
      return res.status(409).json({ error: "Job is no longer available." });
    }

    // Check qualification
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

    // Check if user is in an active negotiation for this job
    const activeNegotiation = await prisma.negotiation.findFirst({
      where: {
        jobId,
        userId: req.auth.id,
        status: "active",
      },
    });
    if (activeNegotiation) {
      return res
        .status(409)
        .json({ error: "You are currently in a negotiation for this job." });
    }

    // Find existing interest
    const existingInterest = await prisma.interest.findUnique({
      where: { userId_jobId: { userId: req.auth.id, jobId } },
    });

    // Withdrawing interest but none exists
    if (
      !interested &&
      (!existingInterest || existingInterest.candidateInterested !== true)
    ) {
      return res
        .status(400)
        .json({ error: "You have not expressed interest in this job." });
    }

    let interest;
    if (existingInterest) {
      interest = await prisma.interest.update({
        where: { userId_jobId: { userId: req.auth.id, jobId } },
        data: { candidateInterested: interested ? true : null },
      });
    } else {
      interest = await prisma.interest.create({
        data: {
          userId: req.auth.id,
          jobId,
          candidateInterested: true,
          businessInterested: null,
        },
      });
    }

    if (interested) {
      await prisma.user.update({
        where: { id: req.auth.id },
        data: {
          available: true,
          lastActive: now,
        },
      });
    }

    return res.status(200).json({
      id: interest.id,
      job_id: interest.jobId,
      candidate: {
        id: req.auth.id,
        interested: interest.candidateInterested,
      },
      business: {
        id: job.business.id,
        interested: interest.businessInterested,
      },
    });
  } catch (error) {
    console.error("PATCH /jobs/:jobId/interested error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
