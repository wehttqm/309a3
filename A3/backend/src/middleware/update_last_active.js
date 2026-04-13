const { prisma } = require("../utils/prisma_client");

const updateLastActive = async (req, res, next) => {
  if (req.auth?.role !== "regular") {
    return next();
  }

  try {
    await prisma.user.update({
      where: { id: req.auth.id },
      data: { lastActive: new Date() },
    });
  } catch (error) {
    const message = String(error?.message || "");
    if (!message.includes("readonly database")) {
      console.error("Failed to update lastActive:", error);
    }
  }

  next();
};

module.exports = { updateLastActive };
