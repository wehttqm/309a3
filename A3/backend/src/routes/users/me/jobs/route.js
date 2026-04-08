const { prisma } = require("../../../../utils/prisma_client.js");

function parsePositiveInt(value, label) {
  if (value === undefined) return undefined;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    const error = new Error(`Invalid ${label}.`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

function normalizeStatuses(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "all") {
    return null;
  }

  const values = Array.isArray(rawValue) ? rawValue : [rawValue];
  const filtered = values.filter(Boolean);
  return filtered.length > 0 ? filtered : null;
}

const GET = async (req, res) => {
  try {
    const pageNum = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limitNum = req.query.limit ? parseInt(req.query.limit, 10) : 10;

    if (Number.isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page." });
    }

    if (Number.isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: "Invalid limit." });
    }

    const positionTypeId = parsePositiveInt(req.query.position_type_id, "position_type_id");
    const businessId = parsePositiveInt(req.query.business_id, "business_id");
    const commitmentState = req.query.commitment_state;
    const statuses = normalizeStatuses(req.query.status);
    const now = new Date();

    const andFilters = [];

    if (statuses) {
      andFilters.push({ status: statuses.length === 1 ? statuses[0] : { in: statuses } });
    } else {
      andFilters.push({ status: { in: ["filled", "canceled", "completed"] } });
    }

    if (positionTypeId) {
      andFilters.push({ positionTypeId });
    }

    if (businessId) {
      andFilters.push({ businessId });
    }

    if (commitmentState && commitmentState !== "all") {
      if (commitmentState === "upcoming") {
        andFilters.push({ status: "filled" });
        andFilters.push({ startTime: { gt: now } });
      } else if (commitmentState === "active") {
        andFilters.push({ status: "filled" });
        andFilters.push({ startTime: { lte: now } });
        andFilters.push({ endTime: { gte: now } });
      } else if (commitmentState === "completed") {
        andFilters.push({
          OR: [
            { status: "completed" },
            {
              AND: [
                { status: "filled" },
                { endTime: { lt: now } },
              ],
            },
          ],
        });
      } else if (commitmentState === "canceled") {
        andFilters.push({ status: "canceled" });
      } else {
        return res.status(400).json({ error: "Invalid commitment_state." });
      }
    }

    const where = {
      filledByUserId: req.auth.id,
      AND: andFilters,
    };

    const [count, jobs] = await Promise.all([
      prisma.jobPosting.count({ where }),
      prisma.jobPosting.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: [{ startTime: "desc" }, { updatedAt: "desc" }],
        include: {
          positionType: { select: { id: true, name: true } },
          business: { select: { id: true, business_name: true } },
        },
      }),
    ]);

    const results = jobs.map((job) => ({
      id: job.id,
      status: job.status,
      position_type: {
        id: job.positionType.id,
        name: job.positionType.name,
      },
      business: {
        id: job.business.id,
        business_name: job.business.business_name,
      },
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      start_time: job.startTime,
      end_time: job.endTime,
      updatedAt: job.updatedAt,
      note: job.note,
    }));

    return res.status(200).json({ count, results });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("GET /users/me/jobs error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };