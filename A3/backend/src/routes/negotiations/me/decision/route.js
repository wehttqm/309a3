const { prisma } = require("../../../../utils/prisma_client.js");

const PATCH = async (req, res) => {
  try {
    const now = new Date();
    const role = req.auth.role;

    if (role !== "regular" && role !== "business") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const { decision, negotiation_id } = req.body;

    if (!decision || !["accept", "decline"].includes(decision)) {
      return res
        .status(400)
        .json({ error: "decision must be 'accept' or 'decline'." });
    }
    if (negotiation_id === undefined || typeof negotiation_id !== "number") {
      return res
        .status(400)
        .json({ error: "negotiation_id must be a number." });
    }

    // Find the user's current active negotiation
    const negotiation = await prisma.negotiation.findFirst({
      where: {
        status: "active",
        ...(role === "regular"
          ? { userId: req.auth.id }
          : { job: { businessId: req.auth.id } }),
      },
      include: {
        job: true,
        interest: true,
      },
    });

    if (!negotiation) {
      return res.status(404).json({ error: "No active negotiation found." });
    }

    // Check negotiation_id matches
    if (negotiation.id !== negotiation_id) {
      return res.status(409).json({
        error: "negotiation_id does not match your current active negotiation.",
      });
    }

    // Check not expired
    if (now >= negotiation.expiresAt) {
      await prisma.$transaction([
        prisma.negotiation.update({
          where: { id: negotiation.id },
          data: { status: "failed" },
        }),
        prisma.interest.update({
          where: { id: negotiation.interestId },
          data: { candidateInterested: null, businessInterested: null },
        }),
        prisma.user.update({
          where: { id: negotiation.userId },
          data: { available: true, lastActive: now },
        }),
      ]);

      return res.status(409).json({ error: "Negotiation has expired." });
    }

    // Apply decision
    const updateData =
      role === "regular"
        ? { candidateDecision: decision }
        : { businessDecision: decision };

    // Determine new status after this decision
    const candidateDecision =
      role === "regular" ? decision : negotiation.candidateDecision;
    const businessDecision =
      role === "business" ? decision : negotiation.businessDecision;

    let newStatus = "active";
    if (decision === "decline") {
      newStatus = "failed";
    } else if (
      candidateDecision === "accept" &&
      businessDecision === "accept"
    ) {
      newStatus = "success";
    }

    updateData.status = newStatus;

    // Handle terminal states in a transaction
    if (newStatus === "success") {
      const [updatedNegotiation] = await prisma.$transaction([
        prisma.negotiation.update({
          where: { id: negotiation.id },
          data: updateData,
        }),
        prisma.jobPosting.update({
          where: { id: negotiation.jobId },
          data: { status: "filled", filledByUserId: negotiation.userId },
        }),
        prisma.user.update({
          where: { id: negotiation.userId },
          data: { available: true, lastActive: now },
        }),
      ]);

      return res.status(200).json({
        id: updatedNegotiation.id,
        status: updatedNegotiation.status,
        createdAt: updatedNegotiation.createdAt,
        expiresAt: updatedNegotiation.expiresAt,
        updatedAt: updatedNegotiation.updatedAt,
        decisions: {
          candidate: updatedNegotiation.candidateDecision,
          business: updatedNegotiation.businessDecision,
        },
      });
    }

    if (newStatus === "failed") {
      const [updatedNegotiation] = await prisma.$transaction([
        prisma.negotiation.update({
          where: { id: negotiation.id },
          data: updateData,
        }),
        // Reset interest for both parties
        prisma.interest.update({
          where: { id: negotiation.interestId },
          data: { candidateInterested: null, businessInterested: null },
        }),
        // Reset regular user's inactivity timer and make available
        prisma.user.update({
          where: { id: negotiation.userId },
          data: { lastActive: now, available: true },
        }),
      ]);

      return res.status(200).json({
        id: updatedNegotiation.id,
        status: updatedNegotiation.status,
        createdAt: updatedNegotiation.createdAt,
        expiresAt: updatedNegotiation.expiresAt,
        updatedAt: updatedNegotiation.updatedAt,
        decisions: {
          candidate: updatedNegotiation.candidateDecision,
          business: updatedNegotiation.businessDecision,
        },
      });
    }

    // Still active, just update the decision
    const updatedNegotiation = await prisma.negotiation.update({
      where: { id: negotiation.id },
      data: updateData,
    });

    return res.status(200).json({
      id: updatedNegotiation.id,
      status: updatedNegotiation.status,
      createdAt: updatedNegotiation.createdAt,
      expiresAt: updatedNegotiation.expiresAt,
      updatedAt: updatedNegotiation.updatedAt,
      decisions: {
        candidate: updatedNegotiation.candidateDecision,
        business: updatedNegotiation.businessDecision,
      },
    });
  } catch (error) {
    console.error("PATCH /negotiations/me/decision error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
