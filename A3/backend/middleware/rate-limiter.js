const { prisma } = require("../utils/prisma_client");

const rateLimitMap = new Map();
const MAX_REQUESTS = 1;

const rateLimiter = async (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  const cooldown_setting = await prisma.systemSetting.findUnique({
    where: {
      key: "reset-cooldown",
    },
  });
  const WINDOW_SIZE_MS = Number(cooldown_setting.value) * 1000;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + WINDOW_SIZE_MS });
    return next();
  }

  const ipUsage = rateLimitMap.get(ip);
  if (now > ipUsage.expiresAt) {
    // Window expired
    rateLimitMap.set(ip, { count: 1, expiresAt: now + WINDOW_SIZE_MS });
    return next();
  }

  if (ipUsage.count < MAX_REQUESTS) {
    // Within limits
    ipUsage.count++;
    rateLimitMap.set(ip, ipUsage);
    return next();
  }

  // Limit exceeded
  res.setHeader("Retry-After", Math.ceil((ipUsage.expiresAt - now) / 1000));
  return res
    .status(429)
    .json({ error: "Too many requests. Please try again later." });
};

setInterval(() => {
  const now = new Date();
  for (const [ip, usage] of rateLimitMap) {
    if (now > usage.expiresAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

module.exports = { rateLimiter };
