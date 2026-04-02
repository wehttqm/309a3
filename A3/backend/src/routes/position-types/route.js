const { prisma } = require("../../utils/prisma_client");

const POST = async (req, res) => {
  const { name, description, hidden = true } = req.body;
  if (!name || !description || typeof hidden !== "boolean") {
    return res.status(400).json({ error: "Invalid payload." });
  }

  try {
    const p = await prisma.positionType.create({
      data: {
        name,
        description,
        hidden,
      },
      select: {
        id: true,
        name: true,
        description: true,
        hidden: true,
        _count: {
          select: {
            qualifications: true,
          },
        },
      },
    });
    return res.status(201).json({
      id: p.id,
      name: p.name,
      description: p.description,
      hidden: p.hidden,
      num_qualified: p._count.qualifications,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const GET = async (req, res) => {
  try {
    const { keyword, name, hidden, num_qualified, page, limit } = req.query;
    const role = req.auth.role;

    if (!["regular", "business", "admin"].includes(role)) {
      return res.status(403).json({ error: "Forbidden." });
    }

    if (
      role !== "admin" &&
      (hidden !== undefined || num_qualified !== undefined)
    ) {
      return res
        .status(400)
        .json({ error: "hidden and num_qualified are admin-only fields." });
    }

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    if (isNaN(pageNum) || pageNum < 1)
      return res.status(400).json({ error: "Invalid page." });
    if (isNaN(limitNum) || limitNum < 1)
      return res.status(400).json({ error: "Invalid limit." });

    if (name !== undefined && !["asc", "desc"].includes(name)) {
      return res
        .status(400)
        .json({ error: "name sort must be 'asc' or 'desc'." });
    }
    if (
      num_qualified !== undefined &&
      !["asc", "desc"].includes(num_qualified)
    ) {
      return res
        .status(400)
        .json({ error: "num_qualified sort must be 'asc' or 'desc'." });
    }

    const where = {};

    if (role !== "admin") {
      where.hidden = false;
    } else if (hidden !== undefined) {
      where.hidden = hidden === "true";
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const positionTypes = await prisma.positionType.findMany({
      where,
      include: {
        _count: {
          select: {
            qualifications: {
              where: { status: "approved" },
            },
          },
        },
      },
    });

    const total = positionTypes.length;

    let sorted = [...positionTypes];
    if (role === "admin") {
      // Sort by num_qualified first, then name on tie
      const numQualifiedOrder = num_qualified === "desc" ? -1 : 1;
      const nameOrder = name === "desc" ? -1 : 1;
      sorted.sort((a, b) => {
        const diff = a._count.qualifications - b._count.qualifications;
        if (diff !== 0) return diff * numQualifiedOrder;
        return a.name.localeCompare(b.name) * nameOrder;
      });
    } else if (name !== undefined) {
      const nameOrder = name === "desc" ? -1 : 1;
      sorted.sort((a, b) => a.name.localeCompare(b.name) * nameOrder);
    }

    const paginated = sorted.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum,
    );

    const results = paginated.map((pt) => {
      const base = {
        id: pt.id,
        name: pt.name,
        description: pt.description,
      };
      if (role === "admin") {
        base.hidden = pt.hidden;
        base.num_qualified = pt._count.qualifications;
      }
      return base;
    });

    return res.status(200).json({ count: total, results });
  } catch (error) {
    console.error("GET /position-types error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { POST, GET };
