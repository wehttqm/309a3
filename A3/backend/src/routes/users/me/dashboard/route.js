const { prisma } = require("../../../../utils/prisma_client.js");
const { deriveAvailabilityState, getAvailabilityTimeoutMs } = require("../../../../utils/availability.js");

function summarizeJob(job) {
  return {
    id: job.id,
    status: job.status,
    position_type: job.positionType
      ? {
          id: job.positionType.id,
          name: job.positionType.name,
        }
      : null,
    business: job.business
      ? {
          id: job.business.id,
          business_name: job.business.business_name,
        }
      : null,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    start_time: job.startTime,
    end_time: job.endTime,
    updatedAt: job.updatedAt,
    note: job.note ?? null,
  };
}

function summarizeInterest(interest) {
  return {
    interest_id: interest.id,
    mutual:
      interest.candidateInterested === true &&
      interest.businessInterested === true,
    candidate_interested: interest.candidateInterested,
    business_interested: interest.businessInterested,
    createdAt: interest.createdAt,
    job: summarizeJob(interest.job),
  };
}

function summarizeQualification(qualification) {
  return {
    id: qualification.id,
    status: qualification.status,
    note: qualification.note,
    document: qualification.document,
    updatedAt: qualification.updatedAt,
    position_type: qualification.positionType
      ? {
          id: qualification.positionType.id,
          name: qualification.positionType.name,
        }
      : null,
  };
}

function summarizeNegotiation(negotiation) {
  if (!negotiation) return null;

  return {
    id: negotiation.id,
    status: negotiation.status,
    createdAt: negotiation.createdAt,
    updatedAt: negotiation.updatedAt,
    expiresAt: negotiation.expiresAt,
    job: summarizeJob(negotiation.job),
    decisions: {
      candidate: negotiation.candidateDecision,
      business: negotiation.businessDecision,
    },
  };
}

function deriveCommitmentState(job, now) {
  const start = new Date(job.startTime).getTime();
  const end = new Date(job.endTime).getTime();

  if (job.status === "canceled") return "canceled";
  if (job.status === "completed") return "completed";
  if (!Number.isNaN(end) && now > end) return "completed";
  if (!Number.isNaN(start) && now < start) return "upcoming";
  if (!Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end) {
    return "active";
  }
  return "filled";
}

const GET = async (req, res) => {
  try {
    const now = new Date();

    const [
      user,
      availabilityTimeoutSetting,
      negotiationWindowSetting,
      allInterests,
      activeNegotiation,
      invitationCount,
      invitationPreview,
      interestCount,
      mutualInterestCount,
      interestPreview,
      committedJobs,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.auth.id },
        include: {
          qualifications: {
            include: {
              positionType: {
                select: { id: true, name: true },
              },
            },
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          },
        },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "availability-timeout" },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "negotiation-window" },
      }),
      prisma.interest.findMany({
        where: { userId: req.auth.id },
        select: { jobId: true },
      }),
      prisma.negotiation.findFirst({
        where: {
          userId: req.auth.id,
          status: "active",
          expiresAt: { gt: now },
        },
        orderBy: [{ createdAt: "desc" }],
        include: {
          job: {
            include: {
              positionType: { select: { id: true, name: true } },
              business: { select: { id: true, business_name: true, avatar: true, activated: true, verified: true } },
            },
          },
        },
      }),
      prisma.interest.count({
        where: {
          userId: req.auth.id,
          businessInterested: true,
          candidateInterested: null,
          job: { status: "open" },
        },
      }),
      prisma.interest.findMany({
        where: {
          userId: req.auth.id,
          businessInterested: true,
          candidateInterested: null,
          job: { status: "open" },
        },
        take: 3,
        orderBy: [{ createdAt: "desc" }],
        include: {
          job: {
            include: {
              positionType: { select: { id: true, name: true } },
              business: { select: { id: true, business_name: true, avatar: true, activated: true, verified: true } },
            },
          },
        },
      }),
      prisma.interest.count({
        where: {
          userId: req.auth.id,
          candidateInterested: true,
        },
      }),
      prisma.interest.count({
        where: {
          userId: req.auth.id,
          candidateInterested: true,
          businessInterested: true,
          job: { status: "open" },
        },
      }),
      prisma.interest.findMany({
        where: {
          userId: req.auth.id,
          candidateInterested: true,
          job: { status: "open" },
        },
        take: 3,
        orderBy: [{ createdAt: "desc" }],
        include: {
          job: {
            include: {
              positionType: { select: { id: true, name: true } },
              business: { select: { id: true, business_name: true, avatar: true, activated: true, verified: true } },
            },
          },
        },
      }),
      prisma.jobPosting.findMany({
        where: {
          filledByUserId: req.auth.id,
          status: { in: ["filled", "completed", "canceled"] },
        },
        orderBy: [{ startTime: "asc" }, { updatedAt: "desc" }],
        include: {
          positionType: { select: { id: true, name: true } },
          business: { select: { id: true, business_name: true, avatar: true, activated: true, verified: true } },
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const availabilityTimeoutMs = getAvailabilityTimeoutMs(
      availabilityTimeoutSetting,
    );

    const approvedQualifications = user.qualifications.filter(
      (qualification) => qualification.status === "approved",
    );
    const pendingQualifications = user.qualifications.filter((qualification) =>
      ["created", "submitted", "revised"].includes(qualification.status),
    );

    const committedJobsWithState = committedJobs.map((job) => ({
      ...job,
      commitment_state: deriveCommitmentState(job, now.getTime()),
    }));
    const upcomingOrActiveJobs = committedJobsWithState.filter((job) =>
      ["upcoming", "active"].includes(job.commitment_state),
    );
    const upcomingCount = upcomingOrActiveJobs.filter(
      (job) => job.commitment_state === "upcoming",
    ).length;
    const activeCount = upcomingOrActiveJobs.filter(
      (job) => job.commitment_state === "active",
    ).length;

    const { effectiveAvailable, availabilityState, message: availabilityMessage } =
      deriveAvailabilityState({
        user,
        now,
        availabilityTimeoutMs,
        approvedQualifications: approvedQualifications.length,
      });

    const approvedPositionTypeIds = approvedQualifications.map(
      (qualification) => qualification.positionTypeId,
    );
    const existingInterestJobIds = new Set(allInterests.map((interest) => interest.jobId));
    const negotiationWindowMs = Number(negotiationWindowSetting?.value || 0) * 1000;

    let newJobs = [];
    if (approvedPositionTypeIds.length > 0) {
      const candidateJobs = await prisma.jobPosting.findMany({
        where: {
          status: "open",
          positionTypeId: { in: approvedPositionTypeIds },
        },
        orderBy: [{ updatedAt: "desc" }, { startTime: "asc" }],
        include: {
          positionType: { select: { id: true, name: true } },
          business: { select: { id: true, business_name: true, avatar: true, activated: true, verified: true } },
        },
      });

      newJobs = candidateJobs.filter((job) => {
        const latestNegotiationStart = new Date(
          new Date(job.startTime).getTime() - negotiationWindowMs,
        );

        return now <= latestNegotiationStart && !existingInterestJobIds.has(job.id);
      });
    }

    return res.status(200).json({
      status: {
        activated: user.activated,
        suspended: user.suspended,
        available: effectiveAvailable,
        raw_available: user.available,
        availability_state: availabilityState,
        availability_timeout_seconds: Math.floor(availabilityTimeoutMs / 1000),
        availability_message: availabilityMessage,
        can_update_availability: !user.suspended,
        can_set_available:
          !user.suspended && approvedQualifications.length > 0,
        can_set_unavailable: !user.suspended,
        approved_qualifications: approvedQualifications.length,
        pending_qualifications: pendingQualifications.length,
        resume_uploaded: Boolean(user.resume),
      },
      cards: {
        upcoming_or_active_jobs: {
          count: upcomingOrActiveJobs.length,
          upcoming_count: upcomingCount,
          active_count: activeCount,
          results: upcomingOrActiveJobs.slice(0, 3).map((job) => ({
            ...summarizeJob(job),
            commitment_state: job.commitment_state,
          })),
        },
        negotiations: {
          count: activeNegotiation ? 1 : 0,
          current: summarizeNegotiation(activeNegotiation),
        },
        invitations: {
          count: invitationCount,
          results: invitationPreview.map(summarizeInterest),
        },
        interests: {
          count: interestCount,
          mutual_count: mutualInterestCount,
          results: interestPreview.map(summarizeInterest),
        },
        new_jobs: {
          count: newJobs.length,
          results: newJobs.slice(0, 3).map(summarizeJob),
        },
        pending_qualifications: {
          count: pendingQualifications.length,
          results: pendingQualifications.slice(0, 3).map(summarizeQualification),
        },
      },
    });
  } catch (error) {
    console.error("GET /users/me/dashboard error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
