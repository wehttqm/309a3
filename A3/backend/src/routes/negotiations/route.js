const { Prisma } = require("@prisma/client");
const { prisma } = require("../../utils/prisma_client.js");
const { isDiscoverable } = require("../../utils/is_discoverable.js");
const { get_io } = require("../../utils/socket_state.js");
const {
  describeBlockingNegotiation,
  expireNegotiationIfNeeded,
  findCurrentActiveNegotiation,
} = require("../../utils/negotiations.js");

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
      avatar: negotiation.job.business.avatar,
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
    avatar: negotiation.user.avatar,
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
      business: { select: { id: true, business_name: true, avatar: true } },
    },
  },
  user: { select: { id: true, first_name: true, last_name: true, avatar: true } },
};

const interestInclude = {
  job: {
    include: {
      positionType: { select: { id: true, name: true } },
      business: { select: { id: true, business_name: true, avatar: true } },
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
};

let negotiationStartQueue = Promise.resolve();

async function withNegotiationStartLock(task) {
  const previous = negotiationStartQueue;
  let release;
  negotiationStartQueue = new Promise((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await task();
  } finally {
    release();
  }
}

async function createNegotiationWithRecovery({ interest, interestId, expiresAt, now }) {
  try {
    const createdNegotiation = await prisma.negotiation.create({
      data: {
        jobId: interest.jobId,
        userId: interest.userId,
        interestId,
        expiresAt,
        status: "active",
        candidateDecision: null,
        businessDecision: null,
      },
      include: negotiationInclude,
    });

    return { negotiation: createdNegotiation, created: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes("interestId")
    ) {
      const existing = await prisma.negotiation.findUnique({
        where: { interestId },
        include: negotiationInclude,
      });

      if (existing) {
        const expired =
          existing.status === "active"
            ? await expireNegotiationIfNeeded(existing, now)
            : false;

        if (!expired && existing.status === "active") {
          return { negotiation: existing, created: false };
        }

        if (existing.interestId !== null) {
          await prisma.negotiation.update({
            where: { id: existing.id },
            data: { interestId: null },
          });
        }

        const retried = await prisma.negotiation.create({
          data: {
            jobId: interest.jobId,
            userId: interest.userId,
            interestId,
            expiresAt,
            status: "active",
            candidateDecision: null,
            businessDecision: null,
          },
          include: negotiationInclude,
        });
        return { negotiation: retried, created: true };
      }
    }

    throw error;
  }
}

const GET = async (req, res) => {
  try {
    const now = new Date();
    const role = req.auth.role;

    if (role !== "regular" && role !== "business") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const where = role === "regular" ? { userId: req.auth.id } : { job: { businessId: req.auth.id } };

    const negotiations = await prisma.negotiation.findMany({
      where,
      include: negotiationInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    let current = null;
    const history = [];

    for (const negotiation of negotiations) {
      let effectiveNegotiation = negotiation;

      if (negotiation.status === "active") {
        const expired = await expireNegotiationIfNeeded(negotiation, now);
        if (expired) {
          effectiveNegotiation = {
            ...negotiation,
            status: "failed",
            updatedAt: now,
          };
        }
      }

      const isCurrentActive =
        effectiveNegotiation.status === "active" && new Date(effectiveNegotiation.expiresAt) > now;

      if (!current && isCurrentActive) {
        current = formatNegotiation(effectiveNegotiation);
      } else {
        history.push(formatNegotiation(effectiveNegotiation));
      }
    }

    return res.status(200).json({
      current,
      history,
      count: negotiations.length,
      active_count: current ? 1 : 0,
      history_count: history.length,
    });
  } catch (error) {
    console.error("GET /negotiations error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const POST = async (req, res) => {
  try {
    const { interest_id } = req.body;

    if (interest_id === undefined || typeof interest_id !== "number") {
      return res.status(400).json({ error: "interest_id must be a number." });
    }

    const role = req.auth.role;
    if (role !== "regular" && role !== "business") {
      return res.status(403).json({ error: "Forbidden." });
    }

    return await withNegotiationStartLock(async () => {
      const now = new Date();

      let interest = await prisma.interest.findUnique({
        where: { id: interest_id },
        include: interestInclude,
      });

      if (!interest) {
        return res.status(404).json({ error: "Interest not found." });
      }

      const isBusiness = role === "business" && interest.job.businessId === req.auth.id;
      const isCandidate = role === "regular" && interest.userId === req.auth.id;
      if (!isBusiness && !isCandidate) {
        return res.status(404).json({ error: "Interest not found." });
      }

      const existingNegotiation = await prisma.negotiation.findUnique({
        where: { interestId: interest_id },
        include: negotiationInclude,
      });

      if (existingNegotiation) {
        const expired =
          existingNegotiation.status === "active"
            ? await expireNegotiationIfNeeded(existingNegotiation, now)
            : false;

        if (!expired && existingNegotiation.status === "active") {
          return res.status(200).json(formatNegotiation(existingNegotiation));
        }

        if (existingNegotiation.status !== "active" && existingNegotiation.interestId !== null) {
          await prisma.negotiation.update({
            where: { id: existingNegotiation.id },
            data: { interestId: null },
          });
        }

        interest = await prisma.interest.findUnique({
          where: { id: interest_id },
          include: interestInclude,
        });

        if (!interest) {
          return res.status(404).json({ error: "Interest not found." });
        }
      }

      if (!interest.candidateInterested || !interest.businessInterested) {
        return res.status(403).json({ error: "Interest is not mutual." });
      }

      if (interest.job.status !== "open") {
        return res.status(409).json({ error: "Job is no longer available for negotiation." });
      }

      const availabilityTimeoutSetting = await prisma.systemSetting.findUnique({
        where: { key: "availability-timeout" },
      });
      const availabilityTimeoutMs = Number(availabilityTimeoutSetting.value) * 1000;

      const conflictingJobs = interest.user.filledJobs.filter(
        (job) => job.startTime <= interest.job.endTime && job.endTime >= interest.job.startTime,
      );
      const userForDiscoverability = {
        ...interest.user,
        qualifications: interest.user.qualifications.filter(
          (qualification) => qualification.positionTypeId === interest.job.positionTypeId,
        ),
        filledJobs: conflictingJobs,
      };

      if (
        !isDiscoverable(userForDiscoverability, now, availabilityTimeoutMs, {
          positionTypeId: interest.job.positionTypeId,
          jobStartTime: interest.job.startTime,
          jobEndTime: interest.job.endTime,
        })
      ) {
        return res.status(403).json({ error: "Regular user is not discoverable." });
      }

      const [candidateActiveNegotiation, businessActiveNegotiation, jobActiveNegotiation] =
        await Promise.all([
          findCurrentActiveNegotiation({ userId: interest.userId }, now),
          findCurrentActiveNegotiation({ job: { businessId: interest.job.businessId } }, now),
          findCurrentActiveNegotiation({ jobId: interest.jobId }, now),
        ]);

      const blockingNegotiation =
        candidateActiveNegotiation || businessActiveNegotiation || jobActiveNegotiation;

      if (blockingNegotiation) {
        return res.status(409).json({
          error: "One or both parties are already in an active negotiation.",
          blocking: describeBlockingNegotiation(blockingNegotiation, now),
        });
      }

      const negotiationWindowSetting = await prisma.systemSetting.findUnique({
        where: { key: "negotiation-window" },
      });
      const negotiationWindowMs = Number(negotiationWindowSetting.value) * 1000;
      const expiresAt = new Date(now.getTime() + negotiationWindowMs);

      const { negotiation, created } = await createNegotiationWithRecovery({
        interest,
        interestId: interest_id,
        expiresAt,
        now,
      });

      const io = get_io();
      if (io && created) {
        const negotiationRoom = `negotiation:${negotiation.id}`;
        const candidateRoom = `account:${interest.userId}`;
        const businessRoom = `account:${interest.job.businessId}`;
        io.in(candidateRoom).socketsJoin(negotiationRoom);
        io.in(businessRoom).socketsJoin(negotiationRoom);
        const payload = { negotiation_id: negotiation.id };
        io.to(candidateRoom).emit("negotiation:started", payload);
        io.to(businessRoom).emit("negotiation:started", payload);
      }

      return res.status(created ? 201 : 200).json(formatNegotiation(negotiation));
    });
  } catch (error) {
    console.error("POST /negotiations error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET, POST };
