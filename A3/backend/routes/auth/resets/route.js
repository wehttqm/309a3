const { prisma } = require("../../../utils/prisma_client");
const { v4: uuidv4 } = require("uuid");

const POST = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Email address does not exist." });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24 * 7);
    const resetToken = uuidv4();

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { expiresAt, resetToken },
    });

    return res.status(202).json({
      expiresAt: updatedUser.expiresAt,
      resetToken: updatedUser.resetToken,
    });
  } catch (error) {
    console.error("Auth Resets Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { POST };
