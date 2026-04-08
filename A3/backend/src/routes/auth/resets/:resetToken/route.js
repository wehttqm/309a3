const { prisma } = require("../../../../utils/prisma_client.js");

const POST = async (req, res) => {
  const { resetToken } = req.params;
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({ error: "Missing email in body." });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.resetToken === "") {
      return res
        .status(404)
        .json({ error: "Reset token not found or already used." });
    }

    if (new Date() > user.expiresAt) {
      return res.status(410).json({ error: "Reset token has expired." });
    }

    if (user.email !== normalizedEmail) {
      return res
        .status(401)
        .json({ error: "Email does not match the provided token." });
    }

    const updateData = {
      activated: true,
      resetToken: "",
      expiresAt: new Date(0),
      ...(password ? { password } : {}),
    };

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return res.status(200).json({ message: "Account processed successfully." });
  } catch (error) {
    console.error("Auth Reset Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { POST };
