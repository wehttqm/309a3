const { prisma } = require("../../../utils/prisma_client.js");

const GET = async (req, res) => {
  try {
    const now = new Date();
    const role = req.auth.role;

    if (role !== "regular" && role !== "business") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const negotiation = await prisma.negotiation.findFirst({
      where: {
        status: "active",
        expiresAt: { gt: now },
        ...(role === "regular"
          ? { userId: req.auth.id }
          : { job: { businessId: req.auth.id } }),
      },
      include: {
        job: {
          include: {
            positionType: { select: { id: true, name: true } },
            business: { select: { id: true, business_name: true } },
          },
        },
        user: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    if (!negotiation) {
      return res.status(404).json({ error: "No active negotiation found." });
    }

    return res.status(200).json({
      id: negotiation.id,
      status: negotiation.status,
      createdAt: negotiation.createdAt,
      expiresAt: negotiation.expiresAt,
      updatedAt: negotiation.updatedAt,
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
        updatedAt: negotiation.job.updatedAt,
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
  } catch (error) {
    console.error("GET /negotiations/me error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
