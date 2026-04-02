const { prisma } = require("../../../utils/prisma_client");
const jwt = require("jsonwebtoken");

const POST = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Invalid payload." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return res
        .status(401)
        .json({ error: "Invalid email or password combination." });
    }

    if (!user.activated) {
      return res.status(403).json({ error: "Account is not activated." });
    }

    const expiresIn = "24h";
    const token = jwt.sign({ id: user.id, role: user.role }, "secret", {
      expiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return res.status(200).json({
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Auth Token Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { POST };
