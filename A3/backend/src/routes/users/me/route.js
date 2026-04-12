const { prisma } = require("../../../utils/prisma_client.js");
const {
  deriveAvailabilityState,
  getAvailabilityTimeoutMs,
} = require("../../../utils/availability.js");

const GET = async (req, res) => {
  try {
    const now = new Date();

    const [user, availabilityTimeoutSetting, approvedQualificationCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: req.auth.id },
        }),
        prisma.systemSetting.findUnique({
          where: { key: "availability-timeout" },
        }),
        prisma.qualification.count({
          where: {
            userId: req.auth.id,
            status: "approved",
          },
        }),
      ]);

    if (!user) return res.status(404).json({ error: "User not found." });

    const availabilityTimeoutMs = getAvailabilityTimeoutMs(
      availabilityTimeoutSetting,
    );

    const {
      effectiveAvailable,
      availabilityState,
      message: availabilityMessage,
    } = deriveAvailabilityState({
      user,
      now,
      availabilityTimeoutMs,
      approvedQualifications: approvedQualificationCount,
    });

    return res.status(200).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      activated: user.activated,
      suspended: user.suspended,
      available: effectiveAvailable,
      raw_available: user.available,
      availability_state: availabilityState,
      availability_message: availabilityMessage,
      role: user.role,
      phone_number: user.phone_number,
      postal_address: user.postal_address,
      birthday: user.birthday,
      createdAt: user.createdAt,
      avatar: user.avatar,
      resume: user.resume,
      biography: user.biography,
      approved_qualifications: approvedQualificationCount,
      can_set_available:
        !user.suspended && approvedQualificationCount > 0 && user.activated,
      can_set_unavailable: !user.suspended,
    });
  } catch (error) {
    console.error("GET /users/me error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const PATCH = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone_number,
      postal_address,
      birthday,
      avatar,
      biography,
    } = req.body;

    const allowedFields = [
      "first_name",
      "last_name",
      "phone_number",
      "postal_address",
      "birthday",
      "avatar",
      "biography",
    ];
    const extraFields = Object.keys(req.body).filter(
      (k) => !allowedFields.includes(k),
    );
    if (extraFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${extraFields.join(", ")}` });
    }

    if (first_name !== undefined && typeof first_name !== "string")
      return res.status(400).json({ error: "first_name must be a string." });
    if (last_name !== undefined && typeof last_name !== "string")
      return res.status(400).json({ error: "last_name must be a string." });
    if (phone_number !== undefined && typeof phone_number !== "string")
      return res.status(400).json({ error: "phone_number must be a string." });
    if (postal_address !== undefined && typeof postal_address !== "string")
      return res
        .status(400)
        .json({ error: "postal_address must be a string." });
    if (avatar !== undefined && avatar !== null && typeof avatar !== "string")
      return res
        .status(400)
        .json({ error: "avatar must be a string or null." });
    if (biography !== undefined && typeof biography !== "string")
      return res.status(400).json({ error: "biography must be a string." });

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (postal_address !== undefined)
      updateData.postal_address = postal_address;
    if (birthday !== undefined) updateData.birthday = birthday;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (biography !== undefined) updateData.biography = biography;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    const updated = await prisma.user.update({
      where: { id: req.auth.id },
      data: updateData,
    });

    const response = { id: updated.id };
    if (first_name !== undefined) response.first_name = updated.first_name;
    if (last_name !== undefined) response.last_name = updated.last_name;
    if (phone_number !== undefined)
      response.phone_number = updated.phone_number;
    if (postal_address !== undefined)
      response.postal_address = updated.postal_address;
    if (birthday !== undefined) response.birthday = updated.birthday;
    if (avatar !== undefined) response.avatar = updated.avatar;
    if (biography !== undefined) response.biography = updated.biography;

    return res.status(200).json(response);
  } catch (error) {
    console.error("PATCH /users/me error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { GET, PATCH };
