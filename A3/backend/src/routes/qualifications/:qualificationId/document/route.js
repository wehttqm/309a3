const { prisma } = require("../../../../utils/prisma_client");

const PUT = async (req, res) => {
  try {
    const qualificationId = parseInt(req.params.qualificationId, 10);
    if (isNaN(qualificationId)) {
      return res.status(400).json({ error: "Invalid qualificationId." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File is required." });
    }

    const qualification = await prisma.qualification.findUnique({
      where: { id: qualificationId },
      select: { id: true, userId: true },
    });

    if (!qualification) {
      return res.status(404).json({ error: "Qualification not found." });
    }

    if (req.auth.role !== "regular" || qualification.userId !== req.auth.id) {
      return res.status(403).json({ error: "Forbidden." });
    }

    const documentPath = `/uploads/users/${req.auth.id}/qualifications/${qualificationId}/${req.file.filename}`;

    const updated = await prisma.qualification.update({
      where: { id: qualificationId },
      data: { document: documentPath },
      select: {
        id: true,
        document: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("PUT /qualifications/:qualificationId/document error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { PUT };
