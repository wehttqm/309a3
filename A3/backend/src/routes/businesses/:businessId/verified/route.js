const { prisma } = require("../../../../utils/prisma_client");

const PATCH = async (req, res) => {
  const { businessId } = req.params;
  const { verified } = req.body;
  const bId = Number(businessId);

  if (isNaN(bId) || typeof verified !== "boolean") {
    return res.status(400).json({ error: "Invalid payload." });
  }

  try {
    const b = await prisma.user.update({
      where: {
        id: bId,
      },
      data: {
        verified,
      },
    });
    return res.json(b);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
