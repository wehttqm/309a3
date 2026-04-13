const { prisma } = require("../../../utils/prisma_client");

async function GET(req, res) {
  const { businessId } = req.params;
  const bId = Number(businessId);

  if (isNaN(bId)) {
    return res.status(400).json({ error: "Invalid payload." });
  }

  try {
    const isAdmin = req.auth && req.auth.role === "admin";

    const business = await prisma.user.findUnique({
      where: {
        id: bId,
      },
    });

    if (!business || business.role !== "business") {
      return res.json({});
    }

    const {
      password,
      resetToken,
      expiresAt,
      locationLat,
      locationLon,
      ...everythingElse
    } = business;

    const baseBusiness = {
      ...everythingElse,
      location: {
        lat: locationLat,
        lon: locationLon,
      },
    };

    if (isAdmin) {
      return res.json(baseBusiness);
    }

    const { owner_name, verified, activated, ...publicFields } = baseBusiness;
    return res.json(publicFields);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { GET };
