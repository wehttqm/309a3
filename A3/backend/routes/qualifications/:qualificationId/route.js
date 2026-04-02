const { prisma } = require("../../../utils/prisma_client");

const GET = async (req, res) => {
  try {
    const qualificationId = parseInt(req.params.qualificationId);
    if (isNaN(qualificationId))
      return res.status(400).json({ error: "Invalid qualificationId." });

    const role = req.auth.role;

    const qualification = await prisma.qualification.findUnique({
      where: { id: qualificationId },
      include: {
        user: true,
        positionType: true,
      },
    });

    if (!qualification)
      return res.status(404).json({ error: "Qualification not found." });

    if (role === "regular" && qualification.userId !== req.auth.id) {
      return res.status(404).json({ error: "Qualification not found." });
    }

    if (role === "business") {
      if (qualification.status !== "approved") {
        return res
          .status(403)
          .json({ error: "Cannot view non-approved qualifications." });
      }

      const mutualInterest = await prisma.interest.findFirst({
        where: {
          userId: qualification.userId,
          candidateInterested: true,
          job: {
            businessId: req.auth.id,
            status: "open",
            positionTypeId: qualification.positionTypeId,
          },
        },
      });

      if (!mutualInterest) {
        return res.status(403).json({ error: "Forbidden." });
      }
    }

    const baseUser = {
      id: qualification.user.id,
      first_name: qualification.user.first_name,
      last_name: qualification.user.last_name,
      role: qualification.user.role,
      avatar: qualification.user.avatar,
      resume: qualification.user.resume,
      biography: qualification.user.biography,
    };

    if (role !== "business") {
      baseUser.email = qualification.user.email;
      baseUser.phone_number = qualification.user.phone_number;
      baseUser.postal_address = qualification.user.postal_address;
      baseUser.birthday = qualification.user.birthday;
      baseUser.activated = qualification.user.activated;
      baseUser.suspended = qualification.user.suspended;
      baseUser.createdAt = qualification.user.createdAt;
    }

    const response = {
      id: qualification.id,
      document: qualification.document,
      note: qualification.note,
      position_type: {
        id: qualification.positionType.id,
        name: qualification.positionType.name,
        description: qualification.positionType.description,
      },
      updatedAt: qualification.updatedAt,
      user: baseUser,
    };

    if (role !== "business") {
      response.status = qualification.status;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("GET /qualifications/:qualificationId error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const PATCH = async (req, res) => {
  try {
    const qualificationId = parseInt(req.params.qualificationId);
    if (isNaN(qualificationId))
      return res.status(400).json({ error: "Invalid qualificationId." });

    const role = req.auth.role;
    const { status, note } = req.body;

    if (role === "business")
      return res.status(403).json({ error: "Forbidden." });

    const qualification = await prisma.qualification.findUnique({
      where: { id: qualificationId },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } },
        positionType: { select: { id: true, name: true } },
      },
    });

    if (!qualification)
      return res.status(404).json({ error: "Qualification not found." });

    if (role === "regular" && qualification.userId !== req.auth.id) {
      return res.status(404).json({ error: "Qualification not found." });
    }

    if (status !== undefined) {
      if (role === "admin") {
        const adminAllowed = {
          submitted: ["approved", "rejected"],
          revised: ["approved", "rejected"],
        };
        if (!adminAllowed[qualification.status]?.includes(status)) {
          return res
            .status(403)
            .json({ error: "Invalid status transition for admin." });
        }
      } else if (role === "regular") {
        const regularAllowed = {
          created: ["submitted"],
          approved: ["revised"],
          rejected: ["revised"],
        };
        if (!regularAllowed[qualification.status]?.includes(status)) {
          return res
            .status(403)
            .json({ error: "Invalid status transition for regular user." });
        }
      }
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({ error: "note must be a string." });
    }

    const updated = await prisma.qualification.update({
      where: { id: qualificationId },
      data: {
        ...(status !== undefined && { status }),
        ...(note !== undefined && { note }),
      },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } },
        positionType: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json({
      id: updated.id,
      status: updated.status,
      document: updated.document,
      note: updated.note,
      user: {
        id: updated.user.id,
        first_name: updated.user.first_name,
        last_name: updated.user.last_name,
      },
      position_type: {
        id: updated.positionType.id,
        name: updated.positionType.name,
      },
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("PATCH /qualifications/:qualificationId error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET, PATCH };
