const { prisma } = require("../../../utils/prisma_client");

async function GET(req, res) {
  const { businessId } = req.params;
  const bId = Number(businessId);

  if (isNaN(bId)) {
    return res.status(400).json({ error: "Invalid payload." });
  }

  try {
    const isAdmin = req.auth && req.auth.role === "admin";

    const b = await prisma.user.findUnique({
      where: {
        id: bId,
      },
    });

    if (!b) {
      return res.json({});
    }

    const { owner_name, verified, activated, ...everything_else } = b;
    const sanitizedResults = isAdmin ? b : everything_else;
    return res.json(sanitizedResults);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { GET };
