const { prisma } = require("../../../utils/prisma_client.js");

async function readSettingValue(key) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  });

  return Number(setting?.value);
}

const GET = async (req, res) => {
  try {
    const reset_cooldown = await readSettingValue("reset-cooldown");
    return res.status(200).json({ reset_cooldown });
  } catch (error) {
    console.error("GET /system/reset-cooldown error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const PATCH = async (req, res) => {
  try {
    const { reset_cooldown } = req.body;

    if (reset_cooldown === undefined || typeof reset_cooldown !== "number") {
      return res
        .status(400)
        .json({ error: "reset_cooldown must be a number." });
    }

    if (reset_cooldown < 0) {
      return res
        .status(400)
        .json({ error: "reset_cooldown must be >= 0." });
    }

    await prisma.systemSetting.update({
      where: { key: "reset-cooldown" },
      data: { value: String(reset_cooldown) },
    });

    return res.status(200).json({ reset_cooldown });
  } catch (error) {
    console.error("PATCH /system/reset-cooldown error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET, PATCH };
