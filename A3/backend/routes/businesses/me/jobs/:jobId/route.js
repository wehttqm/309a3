const { prisma } = require("../../../../../utils/prisma_client");

const PATCH = async (req, res) => {
  try {
    const now = new Date();
    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) return res.status(400).json({ error: "Invalid jobId." });

    const { salary_min, salary_max, start_time, end_time, note } = req.body;

    if (salary_min !== undefined && typeof salary_min !== "number")
      return res.status(400).json({ error: "salary_min must be a number." });
    if (salary_max !== undefined && typeof salary_max !== "number")
      return res.status(400).json({ error: "salary_max must be a number." });
    if (start_time !== undefined && typeof start_time !== "string")
      return res.status(400).json({ error: "start_time must be a string." });
    if (end_time !== undefined && typeof end_time !== "string")
      return res.status(400).json({ error: "end_time must be a string." });
    if (note !== undefined && typeof note !== "string")
      return res.status(400).json({ error: "note must be a string." });

    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });

    if (!job || job.businessId !== req.auth.id) {
      return res.status(404).json({ error: "Job not found." });
    }

    if (job.status !== "open" || now >= job.startTime) {
      return res.status(409).json({ error: "Job can no longer be modified." });
    }

    const startDate = start_time ? new Date(start_time) : job.startTime;
    const endDate = end_time ? new Date(end_time) : job.endTime;

    if (start_time && isNaN(startDate.getTime()))
      return res.status(400).json({ error: "Invalid start_time format." });
    if (end_time && isNaN(endDate.getTime()))
      return res.status(400).json({ error: "Invalid end_time format." });
    if (startDate <= now)
      return res
        .status(400)
        .json({ error: "start_time must be in the future." });
    if (endDate <= now)
      return res.status(400).json({ error: "end_time must be in the future." });
    if (endDate <= startDate)
      return res
        .status(400)
        .json({ error: "end_time must be after start_time." });

    const finalSalaryMin =
      salary_min !== undefined ? salary_min : job.salaryMin;
    const finalSalaryMax =
      salary_max !== undefined ? salary_max : job.salaryMax;
    if (finalSalaryMin < 0)
      return res.status(400).json({ error: "salary_min must be >= 0." });
    if (finalSalaryMax < finalSalaryMin)
      return res
        .status(400)
        .json({ error: "salary_max must be >= salary_min." });

    const [jobStartWindowSetting, negotiationWindowSetting] = await Promise.all(
      [
        prisma.systemSetting.findUnique({ where: { key: "job-start-window" } }),
        prisma.systemSetting.findUnique({
          where: { key: "negotiation-window" },
        }),
      ],
    );

    const jobStartWindowHours = Number(jobStartWindowSetting.value);
    const negotiationWindowSeconds = Number(negotiationWindowSetting.value);

    const maxStartTime = new Date(
      now.getTime() + jobStartWindowHours * 60 * 60 * 1000,
    );
    if (startDate > maxStartTime) {
      return res.status(400).json({
        error: `start_time cannot be more than ${jobStartWindowHours} hours in the future.`,
      });
    }

    const latestNegotiationStart = new Date(
      startDate.getTime() - negotiationWindowSeconds * 1000,
    );
    if (now > latestNegotiationStart) {
      return res.status(400).json({
        error:
          "Not enough time left for a full negotiation window before the job starts.",
      });
    }

    const updateData = {
      ...(salary_min !== undefined && { salaryMin: salary_min }),
      ...(salary_max !== undefined && { salaryMax: salary_max }),
      ...(start_time !== undefined && { startTime: startDate }),
      ...(end_time !== undefined && { endTime: endDate }),
      ...(note !== undefined && { note }),
    };

    const updated = await prisma.jobPosting.update({
      where: { id: jobId },
      data: updateData,
    });

    const responseFields = { id: updated.id };
    if (salary_min !== undefined) responseFields.salary_min = updated.salaryMin;
    if (salary_max !== undefined) responseFields.salary_max = updated.salaryMax;
    if (start_time !== undefined) responseFields.start_time = updated.startTime;
    if (end_time !== undefined) responseFields.end_time = updated.endTime;
    if (note !== undefined) responseFields.note = updated.note;
    responseFields.updatedAt = updated.updatedAt;

    return res.status(200).json(responseFields);
  } catch (error) {
    console.error("PATCH /businesses/me/jobs/:jobId error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const DELETE = async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) return res.status(400).json({ error: "Invalid jobId." });

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        negotiations: {
          where: { status: "active" },
        },
      },
    });

    if (!job || job.businessId !== req.auth.id) {
      return res.status(404).json({ error: "Job not found." });
    }

    if (!["open", "expired"].includes(job.status)) {
      return res
        .status(409)
        .json({ error: "Job cannot be deleted in its current state." });
    }

    if (job.negotiations.length > 0) {
      return res
        .status(409)
        .json({ error: "Cannot delete a job with an active negotiation." });
    }

    await prisma.$transaction([
      prisma.interest.deleteMany({ where: { jobId } }),
      prisma.negotiation.deleteMany({ where: { jobId } }),
      prisma.jobPosting.delete({ where: { id: jobId } }),
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error("DELETE /businesses/me/jobs/:jobId error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH, DELETE };
