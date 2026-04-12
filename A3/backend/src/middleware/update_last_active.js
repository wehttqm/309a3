const { prisma } = require("../utils/prisma_client");

const updateLastActive = async (req, res, next) => {
  if (req.auth && req.auth.role === "regular") {
    try {
      await prisma.user.update({
        where: { id: req.auth.id },
        data: { lastActive: new Date() },
      });
    } catch (error) {
      console.error("Failed to update lastActive:", error);
    }
  }

  next();
};

module.exports = { updateLastActive };
