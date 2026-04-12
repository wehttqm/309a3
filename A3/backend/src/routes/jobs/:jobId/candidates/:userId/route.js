const { prisma } = require("../../../../../utils/prisma_client.js");
const { isDiscoverable } = require("../../../../../utils/is_discoverable.js");

const GET = async (req, res) => {
  try {
    const now = new Date();
    const jobId = parseInt(req.params.jobId);
    const userId = parseInt(req.params.userId);
    if (isNaN(jobId) || isNaN(userId))
      return res.status(404).json({ error: "Not found." });

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        positionType: { select: { id: true, name: true, description: true } },
      },
    });

    if (!job || job.businessId !== req.auth.id) {
      return res.status(404).json({ error: "Job not found." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        qualifications: {
          where: { positionTypeId: job.positionTypeId },
        },
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

    // Check if this user filled this job
    const filledThisJob = job.filledByUserId === userId;

    // Exception: if they filled this job and job hasn't ended yet, always accessible
    const exceptionApplies = filledThisJob && now < job.endTime;

    if (!exceptionApplies) {
      // Check discoverability
      const availabilityTimeoutSetting = await prisma.systemSetting.findUnique({
        where: { key: "availability-timeout" },
      });
      const availabilityTimeoutMs =
        Number(availabilityTimeoutSetting.value) * 1000;
      const cutoff = new Date(now.getTime() - availabilityTimeoutMs);

      if (!isDiscoverable(user, now, availabilityTimeoutMs, {
        positionTypeId: job.positionTypeId,
        jobStartTime: job.startTime,
        jobEndTime: job.endTime,
      })) {
        return res
          .status(403)
          .json({ error: "User is no longer discoverable." });
      }
    }

    const qualification = user.qualifications[0] ?? null;

    const userResponse = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      resume: user.resume,
      biography: user.biography,
      qualification: qualification
        ? {
            id: qualification.id,
            position_type_id: qualification.positionTypeId,
            document: qualification.document,
            note: qualification.note,
            updatedAt: qualification.updatedAt,
          }
        : null,
    };

    // Only show email and phone if candidate filled this job
    if (filledThisJob) {
      userResponse.email = user.email;
      userResponse.phone_number = user.phone_number;
    }

    return res.status(200).json({
      user: userResponse,
      job: {
        id: job.id,
        status: job.status,
        position_type: {
          id: job.positionType.id,
          name: job.positionType.name,
          description: job.positionType.description,
        },
        start_time: job.startTime,
        end_time: job.endTime,
      },
    });
  } catch (error) {
    console.error("GET /jobs/:jobId/candidates/:userId error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
