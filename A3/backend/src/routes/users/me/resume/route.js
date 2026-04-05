const { prisma } = require("../../../../utils/prisma_client");

const PUT = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "File is required." });

    const resumePath = `/uploads/users/${req.auth.id}/resume/${req.file.filename}`;

    await prisma.user.update({
      where: { id: req.auth.id },
      data: { resume: resumePath },
    });

    return res.status(200).json({ resume: resumePath });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};
module.exports = { PUT };
