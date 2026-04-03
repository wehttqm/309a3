const { prisma } = require("../../../utils/prisma_client");

const PATCH = async (req, res) => {
  const { positionTypeId } = req.params;
  const { name, description, hidden } = req.body;

  if (
    (name !== undefined && typeof name !== "string") ||
    (description !== undefined && typeof description !== "string") ||
    (hidden !== undefined && typeof hidden !== "boolean")
  ) {
    return res.status(400).json({ error: "Invalid payload." });
  }

  const pId = Number(positionTypeId);
  if (isNaN(pId)) {
    return res.status(400).json({ error: "Invalid payload." });
  }
  try {
    const existing = await prisma.positionType.findUnique({ where: { id: pId } });
    if (!existing) {
      return res.status(404).json({ error: "Position type not found." });
    }

    const p = await prisma.positionType.update({
      where: {
        id: pId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(hidden !== undefined && { hidden }),
      },
    });

    return res.status(200).json({
      id: p.id,
      ...(name !== undefined && { name: p.name }),
      ...(description !== undefined && { description: p.description }),
      ...(hidden !== undefined && { hidden: p.hidden }),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const DELETE = async (req, res) => {
  const { positionTypeId } = req.params;
  const pId = Number(positionTypeId);
  if (isNaN(pId)) {
    return res.status(400).json({ error: "Invalid payload." });
  }

  try {
    const p = await prisma.positionType.findUnique({
      where: {
        id: pId,
      },
      select: {
        id: true,
        _count: {
          select: {
            qualifications: {
              where: { status: "approved" },
            },
          },
        },
      },
    });

    if (!p) {
      return res.status(404).json({ error: "Position type not found." });
    }

    if (p._count.qualifications > 0) {
      return res.status(409).json({
        error: "Position has a non-zero number of qualified regular users.",
      });
    }

    await prisma.positionType.delete({
      where: {
        id: pId,
      },
    });

    return res.status(204).end();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH, DELETE };
