const { prisma } = require("../../../utils/prisma_client.js");

const PATCH = async (req, res) => {
  try {
    const { availability_timeout } = req.body;

    if (
      availability_timeout === undefined ||
      typeof availability_timeout !== "number"
    ) {
      return res
        .status(400)
        .json({ error: "availability_timeout must be a number." });
    }
    if (availability_timeout <= 0) {
      return res
        .status(400)
        .json({ error: "availability_timeout must be > 0." });
    }

    await prisma.systemSetting.update({
      where: { key: "availability-timeout" },
      data: { value: String(availability_timeout) },
    });

    return res.status(200).json({ availability_timeout });
  } catch (error) {
    console.error("PATCH /system/availability-timeout error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH };
