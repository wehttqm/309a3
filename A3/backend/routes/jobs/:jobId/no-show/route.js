const { prisma } = require("../../../../utils/prisma_client.js");

const PATCH = async (req, res) => {
  try {
    const now = new Date();
    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) return res.status(404).json({ error: "Job not found." });

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job || job.businessId !== req.auth.id) {
      return res.status(404).json({ error: "Job not found." });
    }

    if (job.status !== "filled") {
      return res.status(409).json({ error: "Job is not filled." });
    }

    if (now < job.startTime) {
      return res.status(409).json({ error: "Job has not started yet." });
    }

    if (now >= job.endTime) {
      return res.status(409).json({ error: "Job is already over." });
    }

    const [updatedJob] = await prisma.$transaction([
      prisma.jobPosting.update({
        where: { id: jobId },
        data: { status: "canceled" },
      }),
      prisma.user.update({
        where: { id: job.filledByUserId },
        data: { suspended: true },
      }),
    ]);

    return res.status(200).json({
      id: updatedJob.id,
      status: updatedJob.status,
      updatedAt: updatedJob.updatedAt,
    });
  } catch (error) {
    console.error("PATCH /jobs/:jobId/no-show error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
