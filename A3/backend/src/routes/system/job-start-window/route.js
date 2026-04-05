const { prisma } = require("../../../utils/prisma_client.js");

async function readSettingValue(key) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  });

  return Number(setting?.value);
}

const GET = async (req, res) => {
  try {
    const job_start_window = await readSettingValue("job-start-window");
    return res.status(200).json({ job_start_window });
  } catch (error) {
    console.error("GET /system/job-start-window error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const PATCH = async (req, res) => {
  try {
    const { job_start_window } = req.body;

    if (job_start_window === undefined || typeof job_start_window !== "number") {
      return res
        .status(400)
        .json({ error: "job_start_window must be a number." });
    }

    if (job_start_window <= 0) {
      return res
        .status(400)
        .json({ error: "job_start_window must be > 0." });
    }

    await prisma.systemSetting.update({
      where: { key: "job-start-window" },
      data: { value: String(job_start_window) },
    });

    return res.status(200).json({ job_start_window });
  } catch (error) {
    console.error("PATCH /system/job-start-window error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET, PATCH };
