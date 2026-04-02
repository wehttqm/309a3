const { prisma } = require("../../../utils/prisma_client.js");

const PATCH = async (req, res) => {
  try {
    const { negotiation_window } = req.body;

    if (
      negotiation_window === undefined ||
      typeof negotiation_window !== "number"
    ) {
      return res
        .status(400)
        .json({ error: "negotiation_window must be a number." });
    }
    if (negotiation_window <= 0) {
      return res.status(400).json({ error: "negotiation_window must be > 0." });
    }

    await prisma.systemSetting.update({
      where: { key: "negotiation-window" },
      data: { value: String(negotiation_window) },
    });

    return res.status(200).json({ negotiation_window });
  } catch (error) {
    console.error("PATCH /system/negotiation-window error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
