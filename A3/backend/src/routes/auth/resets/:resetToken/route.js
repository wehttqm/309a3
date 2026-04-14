const { prisma } = require("../../../../utils/prisma_client.js");
const bcrypt = require("bcrypt");

const POST = async (req, res) => {
  const { token } = req.params;
  const { email, password } = req.body;

  if (!email || !resetToken) {
    return res.status(400).json({ error: "Missing email or reset token." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        resetToken: token,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Invalid reset token or email." });
    }

    if (!user.expiresAt || new Date() > user.expiresAt) {
      return res.status(410).json({ error: "Reset token has expired." });
    }

    const updateData = {
      activated: true,
      resetToken: null,
      expiresAt: null,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return res.status(200).json({ message: "Account updated successfully." });
  } catch (error) {
    console.error("Auth Reset Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { POST };
