const { prisma } = require('../../../../utils/prisma_client.js');
const { getAvailabilityTimeoutMs } = require('../../../../utils/availability.js');

const POST = async (req, res) => {
  try {
    const now = new Date();

    const [updatedUser, availabilityTimeoutSetting] = await Promise.all([
      prisma.user.update({
        where: { id: req.auth.id },
        data: { lastActive: now },
        select: {
          id: true,
          available: true,
          lastActive: true,
          suspended: true,
          activated: true,
        },
      }),
      prisma.systemSetting.findUnique({ where: { key: 'availability-timeout' } }),
    ]);

    const availabilityTimeoutMs = getAvailabilityTimeoutMs(availabilityTimeoutSetting);
    const expiresAt = new Date(now.getTime() + availabilityTimeoutMs);

    return res.status(200).json({
      ok: true,
      id: updatedUser.id,
      available: updatedUser.available,
      activated: updatedUser.activated,
      suspended: updatedUser.suspended,
      lastActive: updatedUser.lastActive,
      active_until: expiresAt,
    });
  } catch (error) {
    console.error('POST /users/me/ping error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { POST };
