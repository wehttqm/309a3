const { prisma } = require("../utils/prisma_client");

// Middleware to update lastActive
const updateLastActive = async (req, res, next) => {
  if (req.auth && req.auth.role === "regular") {
    console.log(req.auth);
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
