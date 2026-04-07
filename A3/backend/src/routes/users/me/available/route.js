const { prisma } = require("../../../../utils/prisma_client.js");
const { deriveAvailabilityState } = require("../../../../utils/availability.js");

function normalizeAvailable(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
}

const PATCH = async (req, res) => {
  try {
    const available = normalizeAvailable(req.body?.available);

    if (available === undefined) {
      return res.status(400).json({ error: "available must be a boolean." });
    }

    const authUserId = Number(req.auth?.id);
    if (!Number.isInteger(authUserId) || authUserId <= 0) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUserId },
      select: {
        id: true,
        suspended: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const approvedQualificationCount = await prisma.qualification.count({
      where: {
        userId: authUserId,
        status: "approved",
      },
    });

    if (available) {
      if (user.suspended) {
        return res.status(400).json({
          error: "Suspended users cannot set themselves as available.",
        });
      }

      if (approvedQualificationCount === 0) {
        return res.status(400).json({
          error:
            "You must have at least one approved qualification to set yourself as available.",
        });
      }
    }

    const now = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: authUserId },
      data: {
        available,
        lastActive: available ? now : undefined,
      },
      select: {
        available: true,
        lastActive: true,
        suspended: true,
      },
    });

    const { effectiveAvailable, availabilityState, message } =
      deriveAvailabilityState({
        user: updatedUser,
        now,
        availabilityTimeoutMs: 0,
        approvedQualifications: approvedQualificationCount,
      });

    return res.status(200).json({
      available: effectiveAvailable,
      raw_available: updatedUser.available,
      availability_state: availabilityState,
      lastActive: updatedUser.lastActive,
      message,
    });
  } catch (error) {
    console.error("PATCH /users/me/available error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
