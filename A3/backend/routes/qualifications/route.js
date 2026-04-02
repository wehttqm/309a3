const { prisma } = require("../../utils/prisma_client");

const GET = async (req, res) => {
  try {
    const { keyword, page, limit } = req.query;

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    if (isNaN(pageNum) || pageNum < 1)
      return res.status(400).json({ error: "Invalid page." });
    if (isNaN(limitNum) || limitNum < 1)
      return res.status(400).json({ error: "Invalid limit." });

    const where = {
      status: { in: ["submitted", "revised"] },
      ...(keyword && {
        user: {
          OR: [
            { first_name: { contains: keyword } },
            { last_name: { contains: keyword } },
            { email: { contains: keyword } },
            { phone_number: { contains: keyword } },
          ],
        },
      }),
    };

    const [count, qualifications] = await Promise.all([
      prisma.qualification.count({ where }),
      prisma.qualification.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
          positionType: { select: { id: true, name: true } },
        },
      }),
    ]);

    const results = qualifications.map((q) => ({
      id: q.id,
      status: q.status,
      user: {
        id: q.user.id,
        first_name: q.user.first_name,
        last_name: q.user.last_name,
      },
      position_type: {
        id: q.positionType.id,
        name: q.positionType.name,
      },
      updatedAt: q.updatedAt,
    }));

    return res.status(200).json({ count, results });
  } catch (error) {
    console.error("GET /qualifications error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const POST = async (req, res) => {
  try {
    const { position_type_id, note } = req.body;

    if (position_type_id === undefined) {
      return res.status(400).json({ error: "position_type_id is required." });
    }
    if (typeof position_type_id !== "number") {
      return res
        .status(400)
        .json({ error: "position_type_id must be a number." });
    }
    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({ error: "note must be a string." });
    }

    const positionType = await prisma.positionType.findUnique({
      where: { id: position_type_id },
    });
    if (!positionType || positionType.hidden) {
      return res
        .status(400)
        .json({ error: "Position type does not exist or is hidden." });
    }

    const existing = await prisma.qualification.findUnique({
      where: {
        userId_positionTypeId: {
          userId: req.auth.id,
          positionTypeId: position_type_id,
        },
      },
    });
    if (existing) {
      return res.status(409).json({
        error: "Qualification already exists for this position type.",
      });
    }

    const qualification = await prisma.qualification.create({
      data: {
        userId: req.auth.id,
        positionTypeId: position_type_id,
        note: note ?? "",
        status: "created",
      },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } },
        positionType: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      id: qualification.id,
      status: qualification.status,
      note: qualification.note,
      document: qualification.document,
      user: {
        id: qualification.user.id,
        first_name: qualification.user.first_name,
        last_name: qualification.user.last_name,
      },
      position_type: {
        id: qualification.positionType.id,
        name: qualification.positionType.name,
      },
      updatedAt: qualification.updatedAt,
    });
  } catch (error) {
    console.error("POST /qualifications error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET, POST };
