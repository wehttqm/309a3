const { prisma } = require("../../../../utils/prisma_client.js");

function getJobWindowState(job, nowMs) {
  const startMs = new Date(job.startTime).getTime();
  const endMs = new Date(job.endTime).getTime();

  if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
    if (nowMs >= startMs && nowMs < endMs) return "active";
    if (nowMs < startMs) return "upcoming";
  }

  return job.status;
}

function summarizeJob(job, nowMs, extras = {}) {
  return {
    id: job.id,
    status: job.status,
    window_state: getJobWindowState(job, nowMs),
    position_type: job.positionType
      ? {
          id: job.positionType.id,
          name: job.positionType.name,
        }
      : null,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    start_time: job.startTime,
    end_time: job.endTime,
    updatedAt: job.updatedAt,
    note: job.note ?? null,
    worker: job.filledByUser
      ? {
          id: job.filledByUser.id,
          first_name: job.filledByUser.first_name,
          last_name: job.filledByUser.last_name,
          avatar: job.filledByUser.avatar ?? null,
        }
      : null,
    ...extras,
  };
}

function summarizeNegotiation(negotiation, nowMs) {
  if (!negotiation) return null;

  return {
    id: negotiation.id,
    status: negotiation.status,
    createdAt: negotiation.createdAt,
    updatedAt: negotiation.updatedAt,
    expiresAt: negotiation.expiresAt,
    job: summarizeJob(negotiation.job, nowMs),
    candidate: negotiation.user
      ? {
          id: negotiation.user.id,
          first_name: negotiation.user.first_name,
          last_name: negotiation.user.last_name,
          avatar: negotiation.user.avatar ?? null,
        }
      : null,
    decisions: {
      candidate: negotiation.candidateDecision,
      business: negotiation.businessDecision,
    },
  };
}

const GET = async (req, res) => {
  try {
    const now = new Date();
    const nowMs = now.getTime();
    const businessId = req.auth.id;

    const [
      business,
      activeJobCount,
      upcomingJobCount,
      liveJobPreview,
      openJobCount,
      openJobPreview,
      activeNegotiation,
      candidateInterests,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          business_name: true,
          owner_name: true,
          email: true,
          phone_number: true,
          postal_address: true,
          avatar: true,
          biography: true,
          verified: true,
          activated: true,
          createdAt: true,
        },
      }),
      prisma.jobPosting.count({
        where: {
          businessId,
          status: "filled",
          startTime: { lte: now },
          endTime: { gt: now },
        },
      }),
      prisma.jobPosting.count({
        where: {
          businessId,
          status: "filled",
          startTime: { gt: now },
        },
      }),
      prisma.jobPosting.findMany({
        where: {
          businessId,
          status: "filled",
          endTime: { gt: now },
        },
        orderBy: [{ startTime: "asc" }, { id: "asc" }],
        take: 3,
        include: {
          positionType: { select: { id: true, name: true } },
          filledByUser: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.jobPosting.count({
        where: {
          businessId,
          status: "open",
        },
      }),
      prisma.jobPosting.findMany({
        where: {
          businessId,
          status: "open",
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: 3,
        include: {
          positionType: { select: { id: true, name: true } },
        },
      }),
      prisma.negotiation.findFirst({
        where: {
          status: "active",
          expiresAt: { gt: now },
          job: { businessId },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          job: {
            include: {
              positionType: { select: { id: true, name: true } },
              filledByUser: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.interest.findMany({
        where: {
          candidateInterested: true,
          job: {
            businessId,
            status: "open",
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          job: {
            include: {
              positionType: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    if (!business) {
      return res.status(404).json({ error: "Business not found." });
    }

    const interestByJobId = new Map();
    let mutualInterestCount = 0;

    for (const interest of candidateInterests) {
      if (interest.businessInterested === true) {
        mutualInterestCount += 1;
      }

      const existing = interestByJobId.get(interest.jobId) || {
        job: interest.job,
        count: 0,
        mutual_count: 0,
        latest_interest_at: interest.createdAt,
        candidates: [],
      };

      existing.count += 1;
      if (interest.businessInterested === true) {
        existing.mutual_count += 1;
      }
      if (!existing.latest_interest_at || new Date(interest.createdAt) > new Date(existing.latest_interest_at)) {
        existing.latest_interest_at = interest.createdAt;
      }
      if (existing.candidates.length < 3) {
        existing.candidates.push({
          id: interest.user.id,
          first_name: interest.user.first_name,
          last_name: interest.user.last_name,
          mutual: interest.businessInterested === true,
        });
      }

      interestByJobId.set(interest.jobId, existing);
    }

    const interestResults = Array.from(interestByJobId.values())
      .sort((a, b) => {
        if (b.mutual_count !== a.mutual_count) return b.mutual_count - a.mutual_count;
        if (b.count !== a.count) return b.count - a.count;
        return new Date(b.latest_interest_at) - new Date(a.latest_interest_at);
      })
      .slice(0, 3)
      .map((entry) => ({
        job: summarizeJob(entry.job, nowMs),
        candidate_interest_count: entry.count,
        mutual_interest_count: entry.mutual_count,
        latest_interest_at: entry.latest_interest_at,
        candidates: entry.candidates,
      }));

    const liveJobs = liveJobPreview.map((job) => summarizeJob(job, nowMs));
    const openJobs = openJobPreview.map((job) => {
      const interestSummary = interestByJobId.get(job.id);
      return summarizeJob(job, nowMs, {
        candidate_interest_count: interestSummary?.count || 0,
        mutual_interest_count: interestSummary?.mutual_count || 0,
      });
    });

    return res.status(200).json({
      business,
      status: {
        activated: business.activated,
        verified: business.verified,
        verification_state: business.verified ? "verified" : "pending",
        open_jobs: openJobCount,
        active_jobs: activeJobCount,
        upcoming_jobs: upcomingJobCount,
        candidate_interest_total: candidateInterests.length,
        mutual_interest_total: mutualInterestCount,
        has_active_negotiation: Boolean(activeNegotiation),
      },
      cards: {
        active_jobs: {
          count: activeJobCount + upcomingJobCount,
          active_count: activeJobCount,
          upcoming_count: upcomingJobCount,
          results: liveJobs,
        },
        negotiations: {
          count: activeNegotiation ? 1 : 0,
          current: summarizeNegotiation(activeNegotiation, nowMs),
        },
        interests: {
          count: interestByJobId.size,
          total_candidates: candidateInterests.length,
          mutual_count: mutualInterestCount,
          results: interestResults,
        },
        open_jobs: {
          count: openJobCount,
          results: openJobs,
        },
      },
    });
  } catch (error) {
    console.error("GET /businesses/me/dashboard error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
