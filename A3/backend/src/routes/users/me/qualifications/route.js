const { prisma } = require("../../../../utils/prisma_client");

const GET = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page." });
    }

    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: "Invalid limit." });
    }

    const where = { userId: req.auth.id };

    const [count, qualifications] = await Promise.all([
      prisma.qualification.count({ where }),
      prisma.qualification.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
          positionType: { select: { id: true, name: true } },
        },
      }),
    ]);

    const results = qualifications.map((q) => ({
      id: q.id,
      status: q.status,
      note: q.note,
      document: q.document,
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
    console.error("GET /users/me/qualifications error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET };
