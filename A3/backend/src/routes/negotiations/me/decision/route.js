const { prisma } = require("../../../../utils/prisma_client.js");
const { get_io } = require("../../../../utils/socket_state.js");
const { expireNegotiationIfNeeded } = require("../../../../utils/negotiations.js");

const PATCH = async (req, res) => {
  try {
    const now = new Date();
    const role = req.auth.role;

    if (role !== "regular" && role !== "business") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const { decision, negotiation_id } = req.body;

    if (!decision || !["accept", "decline"].includes(decision)) {
      return res.status(400).json({ error: "decision must be 'accept' or 'decline'." });
    }
    if (negotiation_id === undefined || typeof negotiation_id !== "number") {
      return res.status(400).json({ error: "negotiation_id must be a number." });
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiation_id },
      include: {
        job: { select: { id: true, businessId: true, status: true } },
        interest: { select: { id: true } },
      },
    });

    if (!negotiation) {
      return res.status(404).json({ error: "Negotiation not found." });
    }

    const isParty =
      (role === "regular" && negotiation.userId === req.auth.id) ||
      (role === "business" && negotiation.job.businessId === req.auth.id);

    if (!isParty) {
      return res.status(404).json({ error: "Negotiation not found." });
    }

    if (negotiation.status !== "active") {
      return res.status(409).json({ error: "Negotiation is no longer active." });
    }

    if (now >= negotiation.expiresAt) {
      await expireNegotiationIfNeeded(negotiation, now);
      return res.status(409).json({ error: "Negotiation has expired." });
    }

    const updateData = role === "regular" ? { candidateDecision: decision } : { businessDecision: decision };

    const candidateDecision = role === "regular" ? decision : negotiation.candidateDecision;
    const businessDecision = role === "business" ? decision : negotiation.businessDecision;

    let newStatus = "active";
    if (decision === "decline") {
      newStatus = "failed";
    } else if (candidateDecision === "accept" && businessDecision === "accept") {
      newStatus = "success";
    }

    updateData.status = newStatus;

    if (newStatus === "success") {
      const operations = [
        prisma.negotiation.update({
          where: { id: negotiation.id },
          data: { ...updateData, interestId: null },
        }),
        prisma.jobPosting.update({
          where: { id: negotiation.jobId },
          data: { status: "filled", filledByUserId: negotiation.userId },
        }),
        prisma.user.update({
          where: { id: negotiation.userId },
          data: { available: true, lastActive: now },
        }),
      ];

      const [updatedNegotiation] = await prisma.$transaction(operations);

      const responseBody = {
        id: updatedNegotiation.id,
        status: updatedNegotiation.status,
        createdAt: updatedNegotiation.createdAt,
        expiresAt: updatedNegotiation.expiresAt,
        updatedAt: updatedNegotiation.updatedAt,
        decisions: {
          candidate: updatedNegotiation.candidateDecision,
          business: updatedNegotiation.businessDecision,
        },
      };

      const io = get_io();
      if (io) {
        const payload = {
          negotiation_id: updatedNegotiation.id,
          status: updatedNegotiation.status,
          createdAt: updatedNegotiation.createdAt,
          expiresAt: updatedNegotiation.expiresAt,
          updatedAt: updatedNegotiation.updatedAt,
          decisions: responseBody.decisions,
          message: "Congratulations — both parties accepted. The shift is now confirmed.",
        };

        io.to(`negotiation:${updatedNegotiation.id}`).emit("negotiation:decision", payload);
        io.to(`negotiation:${updatedNegotiation.id}`).emit("negotiation:completed", payload);
        io.to(`account:${negotiation.userId}`).emit("negotiation:completed", payload);
        io.to(`account:${negotiation.job.businessId}`).emit("negotiation:completed", payload);
      }

      return res.status(200).json(responseBody);
    }

    if (newStatus === "failed") {
      const operations = [
        prisma.negotiation.update({
          where: { id: negotiation.id },
          data: { ...updateData, interestId: null },
        }),
        prisma.user.update({
          where: { id: negotiation.userId },
          data: { lastActive: now, available: true },
        }),
      ];

      if (negotiation.interestId) {
        operations.splice(1, 0, prisma.interest.update({
          where: { id: negotiation.interestId },
          data: { candidateInterested: null, businessInterested: null },
        }));
      }

      const [updatedNegotiation] = await prisma.$transaction(operations);

      const responseBody = {
        id: updatedNegotiation.id,
        status: updatedNegotiation.status,
        createdAt: updatedNegotiation.createdAt,
        expiresAt: updatedNegotiation.expiresAt,
        updatedAt: updatedNegotiation.updatedAt,
        decisions: {
          candidate: updatedNegotiation.candidateDecision,
          business: updatedNegotiation.businessDecision,
        },
      };

      const io = get_io();
      if (io) {
        const payload = {
          negotiation_id: updatedNegotiation.id,
          status: updatedNegotiation.status,
          createdAt: updatedNegotiation.createdAt,
          expiresAt: updatedNegotiation.expiresAt,
          updatedAt: updatedNegotiation.updatedAt,
          decisions: responseBody.decisions,
        };
        io.to(`negotiation:${updatedNegotiation.id}`).emit("negotiation:decision", payload);
      }

      return res.status(200).json(responseBody);
    }

    const updatedNegotiation = await prisma.negotiation.update({
      where: { id: negotiation.id },
      data: updateData,
    });

    const responseBody = {
      id: updatedNegotiation.id,
      status: updatedNegotiation.status,
      createdAt: updatedNegotiation.createdAt,
      expiresAt: updatedNegotiation.expiresAt,
      updatedAt: updatedNegotiation.updatedAt,
      decisions: {
        candidate: updatedNegotiation.candidateDecision,
        business: updatedNegotiation.businessDecision,
      },
    };

    const io = get_io();
    if (io) {
      io.to(`negotiation:${updatedNegotiation.id}`).emit("negotiation:decision", {
        negotiation_id: updatedNegotiation.id,
        status: updatedNegotiation.status,
        createdAt: updatedNegotiation.createdAt,
        expiresAt: updatedNegotiation.expiresAt,
        updatedAt: updatedNegotiation.updatedAt,
        decisions: responseBody.decisions,
      });
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error("PATCH /negotiations/me/decision error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
