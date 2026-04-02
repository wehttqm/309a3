const { prisma } = require("../../../../utils/prisma_client.js");

const PATCH = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId))
      return res.status(404).json({ error: "User not found." });

    const { suspended } = req.body;

    if (suspended === undefined || typeof suspended !== "boolean") {
      return res.status(400).json({ error: "suspended must be a boolean." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== "regular") {
      return res.status(404).json({ error: "User not found." });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { suspended },
    });

    return res.status(200).json({
      id: updated.id,
      first_name: updated.first_name,
      last_name: updated.last_name,
      email: updated.email,
      activated: updated.activated,
      suspended: updated.suspended,
      role: updated.role,
      phone_number: updated.phone_number,
      postal_address: updated.postal_address,
    });
  } catch (error) {
    console.error("PATCH /users/:userId/suspended error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
