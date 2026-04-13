const { prisma } = require("./prisma_client.js");

async function expireNegotiationIfNeeded(negotiation, now = new Date()) {
  if (!negotiation || negotiation.status !== "active") {
    return false;
  }

  if (new Date(negotiation.expiresAt) > now) {
    return false;
  }

  await prisma.$transaction([
    prisma.negotiation.update({
      where: { id: negotiation.id },
      data: { status: "failed", interestId: null },
    }),
    ...(negotiation.interestId
      ? [
          prisma.interest.update({
            where: { id: negotiation.interestId },
            data: { candidateInterested: null, businessInterested: null },
          }),
        ]
      : []),
    prisma.user.update({
      where: { id: negotiation.userId },
      data: { available: true, lastActive: now },
    }),
  ]);

  return true;
}

async function findCurrentActiveNegotiation(extraWhere = {}, now = new Date()) {
  const negotiations = await prisma.negotiation.findMany({
    where: {
      status: "active",
      ...extraWhere,
    },
    orderBy: { expiresAt: "asc" },
    select: {
      id: true,
      expiresAt: true,
      interestId: true,
      userId: true,
      jobId: true,
      status: true,
    },
  });

  for (const negotiation of negotiations) {
    const expired = await expireNegotiationIfNeeded(negotiation, now);
    if (!expired) {
      return negotiation;
    }
  }

  return null;
}

function describeBlockingNegotiation(negotiation, now = new Date()) {
  if (!negotiation) {
    return null;
  }

  const wait_seconds = Math.max(
    0,
    Math.ceil((new Date(negotiation.expiresAt).getTime() - now.getTime()) / 1000),
  );

  return {
    negotiation_id: negotiation.id,
    wait_seconds,
    available_at: negotiation.expiresAt,
  };
}

module.exports = {
  expireNegotiationIfNeeded,
  findCurrentActiveNegotiation,
  describeBlockingNegotiation,
};
