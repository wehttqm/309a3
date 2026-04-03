const { prisma } = require("../../../utils/prisma_client");

async function GET(req, res) {
  try {
    const business = await prisma.user.findUnique({
      where: { id: req.auth.id },
    });

    if (!business) {
      return res.status(404).json({ error: "Business profile not found." });
    }

    const response = {
      id: business.id,
      business_name: business.business_name,
      email: business.email,
      role: business.role,
      phone_number: business.phone_number,
      postal_address: business.postal_address,
      location: {
        lon: business.locationLon,
        lat: business.locationLat,
      },
      avatar: business.avatar,
      biography: business.biography,
      activated: business.activated,
      owner_name: business.owner_name,
      verified: business.verified,
      createdAt: business.createdAt,
    };

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function PATCH(req, res) {
  try {
    const {
      business_name,
      owner_name,
      phone_number,
      postal_address,
      location,
      avatar,
      biography,
    } = req.body;

    const b = await prisma.user.update({
      where: { id: req.auth.id },
      data: {
        ...(business_name !== undefined && { business_name }),
        ...(owner_name !== undefined && { owner_name }),
        ...(phone_number !== undefined && { phone_number }),
        ...(postal_address !== undefined && { postal_address }),
        ...(location !== undefined && {
          locationLat: location?.lat ?? null,
          locationLon: location?.lon ?? null,
        }),
        ...(avatar !== undefined && { avatar }),
        ...(biography !== undefined && { biography }),
      },
    });

    return res.json({
      ...(business_name !== undefined && { business_name: b.business_name }),
      ...(owner_name !== undefined && { owner_name: b.owner_name }),
      ...(phone_number !== undefined && { phone_number: b.phone_number }),
      ...(postal_address !== undefined && { postal_address: b.postal_address }),
      ...(location !== undefined && { location: { lat: b.locationLat, lon: b.locationLon } }),
      ...(avatar !== undefined && { avatar: b.avatar }),
      ...(biography !== undefined && { biography: b.biography }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { GET, PATCH };
