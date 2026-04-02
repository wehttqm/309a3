const { prisma } = require("../../../utils/prisma_client");

const PATCH = async (req, res) => {
  const { positionTypeId } = req.params;
  const { name, description, hidden } = req.body;

  if (
    (name && typeof name !== "string") ||
    (description && typeof description !== "string") ||
    (hidden && typeof hidden !== "boolean")
  ) {
    return res.status(400).json({ error: "Invalid payload." });
  }

  const pId = Number(positionTypeId);
  if (isNaN(pId)) {
    return res.status(400).json({ error: "Invalid payload." });
  }
  try {
    const p = await prisma.positionType.update({
      where: {
        id: pId,
      },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(hidden && { hidden }),
      },
    });

    return res.status(200).json({
      ...(name && { name: p.name }),
      ...(description && { description: p.description }),
      ...(hidden && { hidden: p.hidden }),
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
        _count: {
          select: {
            qualifications: true,
          },
        },
      },
    });

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

    return res.status(209).json();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PATCH, DELETE };
