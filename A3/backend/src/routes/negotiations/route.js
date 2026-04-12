const { prisma } = require("../../utils/prisma_client.js");
const { isDiscoverable } = require("../../utils/is_discoverable.js");
const { get_io } = require("../../utils/socket_state.js");

const formatNegotiation = (negotiation) => ({
  id: negotiation.id,
  status: negotiation.status,
  createdAt: negotiation.createdAt,
  updatedAt: negotiation.updatedAt,
  expiresAt: negotiation.expiresAt,
  job: {
    id: negotiation.job.id,
    status: negotiation.job.status,
    position_type: {
      id: negotiation.job.positionType.id,
      name: negotiation.job.positionType.name,
    },
    business: {
      id: negotiation.job.business.id,
      business_name: negotiation.job.business.business_name,
    },
    salary_min: negotiation.job.salaryMin,
    salary_max: negotiation.job.salaryMax,
    start_time: negotiation.job.startTime,
    end_time: negotiation.job.endTime,
  },
  user: {
    id: negotiation.user.id,
    first_name: negotiation.user.first_name,
    last_name: negotiation.user.last_name,
  },
  decisions: {
    candidate: negotiation.candidateDecision,
    business: negotiation.businessDecision,
  },
});

const negotiationInclude = {
  job: {
    include: {
      positionType: { select: { id: true, name: true } },
      business: { select: { id: true, business_name: true } },
    },
  },
  user: { select: { id: true, first_name: true, last_name: true } },
};

const POST = async (req, res) => {
  try {
    const now = new Date();
    const { interest_id } = req.body;

    if (interest_id === undefined || typeof interest_id !== "number") {
      return res.status(400).json({ error: "interest_id must be a number." });
    }

    const role = req.auth.role;
    if (role !== "regular" && role !== "business") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const interest = await prisma.interest.findUnique({
      where: { id: interest_id },
      include: {
        job: {
          include: {
            positionType: { select: { id: true, name: true } },
            business: { select: { id: true, business_name: true } },
          },
        },
        user: {
          include: {
            qualifications: {
              where: { status: "approved" },
            },
            filledJobs: {
              where: {
                status: "filled",
              },
            },
          },
        },
      },
    });

    if (!interest)
      return res.status(404).json({ error: "Interest not found." });

    const isBusiness =
      role === "business" && interest.job.businessId === req.auth.id;
    const isCandidate = role === "regular" && interest.userId === req.auth.id;
    if (!isBusiness && !isCandidate) {
      return res.status(404).json({ error: "Interest not found." });
    }

    const existingNegotiation = await prisma.negotiation.findUnique({
      where: { interestId: interest_id },
      include: negotiationInclude,
    });

    if (existingNegotiation && existingNegotiation.status === "active") {
      if (existingNegotiation.expiresAt > now) {
        return res.status(200).json(formatNegotiation(existingNegotiation));
      }

      await prisma.$transaction([
        prisma.negotiation.update({
          where: { id: existingNegotiation.id },
          data: { status: "failed" },
        }),
        prisma.interest.update({
          where: { id: interest_id },
          data: { candidateInterested: null, businessInterested: null },
        }),
        prisma.user.update({
          where: { id: interest.userId },
          data: { available: true, lastActive: now },
        }),
      ]);

      interest.candidateInterested = null;
      interest.businessInterested = null;
    }

    if (!interest.candidateInterested || !interest.businessInterested) {
      return res.status(403).json({ error: "Interest is not mutual." });
    }

    if (interest.job.status !== "open") {
      return res
        .status(409)
        .json({ error: "Job is no longer available for negotiation." });
    }

    const availabilityTimeoutSetting = await prisma.systemSetting.findUnique({
      where: { key: "availability-timeout" },
    });
    const availabilityTimeoutMs =
      Number(availabilityTimeoutSetting.value) * 1000;

    const conflictingJobs = interest.user.filledJobs.filter(
      (j) =>
        j.startTime <= interest.job.endTime &&
        j.endTime >= interest.job.startTime,
    );
    const userForDiscoverability = {
      ...interest.user,
      qualifications: interest.user.qualifications.filter(
        (q) => q.positionTypeId === interest.job.positionTypeId,
      ),
      filledJobs: conflictingJobs,
    };

    if (!isDiscoverable(userForDiscoverability, now, availabilityTimeoutMs, {
      positionTypeId: interest.job.positionTypeId,
      jobStartTime: interest.job.startTime,
      jobEndTime: interest.job.endTime,
    })) {
      return res
        .status(403)
        .json({ error: "Regular user is not discoverable." });
    }

    const [candidateActiveNegotiation, businessActiveNegotiation] =
      await Promise.all([
        prisma.negotiation.findFirst({
          where: {
            userId: interest.userId,
            status: "active",
            expiresAt: { gt: now },
          },
        }),
        prisma.negotiation.findFirst({
          where: {
            jobId: interest.jobId,
            status: "active",
            expiresAt: { gt: now },
          },
        }),
      ]);

    if (candidateActiveNegotiation || businessActiveNegotiation) {
      return res.status(409).json({
        error: "One or both parties are already in an active negotiation.",
      });
    }

    const negotiationWindowSetting = await prisma.systemSetting.findUnique({
      where: { key: "negotiation-window" },
    });
    const negotiationWindowMs = Number(negotiationWindowSetting.value) * 1000;
    const expiresAt = new Date(now.getTime() + negotiationWindowMs);

    const negotiation = await prisma.negotiation.create({
      data: {
        jobId: interest.jobId,
        userId: interest.userId,
        interestId: interest_id,
        expiresAt,
        status: "active",
        candidateDecision: null,
        businessDecision: null,
      },
      include: negotiationInclude,
    });

    const io = get_io();
    if (io) {
      const negotiationRoom = `negotiation:${negotiation.id}`;
      const candidateRoom = `account:${interest.userId}`;
      const businessRoom = `account:${interest.job.businessId}`;
      io.in(candidateRoom).socketsJoin(negotiationRoom);
      io.in(businessRoom).socketsJoin(negotiationRoom);
      const payload = { negotiation_id: negotiation.id };
      io.to(candidateRoom).emit("negotiation:started", payload);
      io.to(businessRoom).emit("negotiation:started", payload);
    }

    return res.status(201).json(formatNegotiation(negotiation));
  } catch (error) {
    console.error("POST /negotiations error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { POST };
