const { prisma } = require("../../../../utils/prisma_client");

const GET = async (req, res) => {
  try {
    const {
      position_type_id,
      salary_min,
      salary_max,
      start_time,
      end_time,
      page,
      limit,
    } = req.query;

    let { status } = req.query;

    // Validate and parse pagination
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    if (isNaN(pageNum) || pageNum < 1)
      return res.status(400).json({ error: "Invalid page number." });
    if (isNaN(limitNum) || limitNum < 1)
      return res.status(400).json({ error: "Invalid limit." });

    // Validate and parse status filter
    const validStatuses = [
      "open",
      "expired",
      "filled",
      "canceled",
      "completed",
    ];
    if (status === undefined) {
      status = ["open", "filled"];
    } else {
      if (!Array.isArray(status)) status = [status];
      for (const s of status) {
        if (!validStatuses.includes(s)) {
          return res.status(400).json({ error: `Invalid status: ${s}` });
        }
      }
    }

    // Validate optional filters
    if (position_type_id !== undefined && isNaN(parseInt(position_type_id))) {
      return res.status(400).json({ error: "Invalid position_type_id." });
    }
    if (salary_min !== undefined && isNaN(parseFloat(salary_min))) {
      return res.status(400).json({ error: "Invalid salary_min." });
    }
    if (salary_max !== undefined && isNaN(parseFloat(salary_max))) {
      return res.status(400).json({ error: "Invalid salary_max." });
    }
    if (start_time !== undefined && isNaN(Date.parse(start_time))) {
      return res.status(400).json({ error: "Invalid start_time." });
    }
    if (end_time !== undefined && isNaN(Date.parse(end_time))) {
      return res.status(400).json({ error: "Invalid end_time." });
    }

    const where = {
      businessId: req.auth.id,
      status: { in: status },
      ...(position_type_id && { positionTypeId: parseInt(position_type_id) }),
      ...(salary_min !== undefined && {
        salaryMin: { gte: parseFloat(salary_min) },
      }),
      ...(salary_max !== undefined && {
        salaryMax: { gte: parseFloat(salary_max) },
      }),
      ...(start_time !== undefined && {
        startTime: { gte: new Date(start_time) },
      }),
      ...(end_time !== undefined && { endTime: { lte: new Date(end_time) } }),
    };

    const [count, jobs] = await Promise.all([
      prisma.jobPosting.count({ where }),
      prisma.jobPosting.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          positionType: { select: { id: true, name: true } },
          filledByUser: {
            select: { id: true, first_name: true, last_name: true },
          },
        },
      }),
    ]);

    const results = jobs.map((job) => ({
      id: job.id,
      status: job.status,
      position_type: { id: job.positionType.id, name: job.positionType.name },
      business_id: job.businessId,
      worker: job.filledByUser
        ? {
            id: job.filledByUser.id,
            first_name: job.filledByUser.first_name,
            last_name: job.filledByUser.last_name,
          }
        : null,
      salary_min: job.salaryMin,
      salary_max: job.salaryMax,
      start_time: job.startTime,
      end_time: job.endTime,
      updatedAt: job.updatedAt,
    }));

    return res.status(200).json({ count, results });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

const POST = async (req, res) => {
  const now = new Date();
  const {
    position_type_id,
    salary_min,
    salary_max,
    start_time,
    end_time,
    note,
  } = req.body;

  // Check required fields
  if (
    position_type_id === undefined ||
    salary_min === undefined ||
    salary_max === undefined ||
    !start_time ||
    !end_time
  ) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  // Type checks
  if (typeof position_type_id !== "number")
    return res
      .status(400)
      .json({ error: "position_type_id must be a number." });
  if (typeof salary_min !== "number")
    return res.status(400).json({ error: "salary_min must be a number." });
  if (typeof salary_max !== "number")
    return res.status(400).json({ error: "salary_max must be a number." });
  if (typeof start_time !== "string")
    return res.status(400).json({ error: "start_time must be a string." });
  if (typeof end_time !== "string")
    return res.status(400).json({ error: "end_time must be a string." });
  if (note !== undefined && typeof note !== "string")
    return res.status(400).json({ error: "note must be a string." });

  // Validate salary
  if (salary_min < 0)
    return res.status(400).json({ error: "salary_min must be >= 0." });
  if (salary_max < salary_min)
    return res.status(400).json({ error: "salary_max must be >= salary_min." });

  // Validate times
  const startDate = new Date(start_time);
  const endDate = new Date(end_time);
  if (isNaN(startDate.getTime()))
    return res.status(400).json({ error: "Invalid start_time format." });
  if (isNaN(endDate.getTime()))
    return res.status(400).json({ error: "Invalid end_time format." });
  if (startDate <= now)
    return res.status(400).json({ error: "start_time must be in the future." });
  if (endDate <= now)
    return res.status(400).json({ error: "end_time must be in the future." });
  if (endDate <= startDate)
    return res
      .status(400)
      .json({ error: "end_time must be after start_time." });

  const business = await prisma.user.findUnique({
    where: { id: req.auth.id },
  });
  if (!business.verified) {
    return res.status(403).json({ error: "Business is not verified." });
  }

  const [jobStartWindowSetting, negotiationWindowSetting] = await Promise.all([
    prisma.systemSetting.findUnique({
      where: { key: "job-start-window" },
    }),
    prisma.systemSetting.findUnique({
      where: { key: "negotiation-window" },
    }),
  ]);

  const jobStartWindowHours = Number(jobStartWindowSetting.value);
  const negotiationWindowSeconds = Number(negotiationWindowSetting.value);

  const maxStartTime = new Date(
    now.getTime() + jobStartWindowHours * 60 * 60 * 1000,
  );
  if (startDate > maxStartTime) {
    return res.status(400).json({
      error: `start_time cannot be more than ${jobStartWindowHours} hours in the future.`,
    });
  }

  const latestNegotiationStart = new Date(
    startDate.getTime() - negotiationWindowSeconds * 1000,
  );
  if (now > latestNegotiationStart) {
    return res.status(400).json({
      error:
        "Not enough time left for a full negotiation window before the job starts.",
    });
  }

  const positionType = await prisma.positionType.findUnique({
    where: { id: position_type_id },
  });
  if (!positionType || positionType.isHidden) {
    return res.status(400).json({ error: "Invalid or hidden position type." });
  }

  const job = await prisma.jobPosting.create({
    data: {
      businessId: req.auth.id,
      positionTypeId: position_type_id,
      salaryMin: salary_min,
      salaryMax: salary_max,
      startTime: startDate,
      endTime: endDate,
      note: note ?? null,
      status: "open",
    },
    include: {
      positionType: { select: { id: true, name: true } },
      business: { select: { id: true, business_name: true } },
    },
  });

  return res.status(201).json({
    id: job.id,
    status: job.status,
    position_type: { id: job.positionType.id, name: job.positionType.name },
    business: {
      id: job.business.id,
      business_name: job.business.business_name,
    },
    worker: null,
    note: job.note,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    start_time: job.startTime,
    end_time: job.endTime,
    updatedAt: job.updatedAt,
  });
};

module.exports = { GET, POST };
