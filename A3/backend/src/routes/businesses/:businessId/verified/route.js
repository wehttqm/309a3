const { prisma } = require("../../../../utils/prisma_client");

const PATCH = async (req, res) => {
  const { businessId } = req.params;
  const { verified } = req.body;
  const bId = Number(businessId);

  if (isNaN(bId) || typeof verified !== "boolean") {
    return res.status(400).json({ error: "Invalid payload." });
  }

  try {
    const business = await prisma.user.findUnique({ where: { id: bId } });
    if (!business || business.role !== "business") {
      return res.status(404).json({ error: "Business not found." });
    }

    const updated = await prisma.user.update({
      where: { id: bId },
      data: { verified },
      select: {
        id: true,
        business_name: true,
        owner_name: true,
        email: true,
        activated: true,
        verified: true,
        role: true,
        phone_number: true,
        postal_address: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
