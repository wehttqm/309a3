const { prisma } = require("../../../../utils/prisma_client.js");

const PATCH = async (req, res) => {
  try {
    const { available } = req.body;

    if (available === undefined || typeof available !== "boolean") {
      return res.status(400).json({ error: "available must be a boolean." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.id },
      include: {
        qualifications: {
          where: { status: "approved" },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found." });

    if (available === true) {
      if (user.suspended) {
        return res.status(400).json({
          error: "Suspended users cannot set themselves as available.",
        });
      }
      if (user.qualifications.length === 0) {
        return res.status(400).json({
          error:
            "You must have at least one approved qualification to set yourself as available.",
        });
      }
    }

    await prisma.user.update({
      where: { id: req.auth.id },
      data: { available },
    });

    return res.status(200).json({ available });
  } catch (error) {
    console.error("PATCH /users/me/available error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
