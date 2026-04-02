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
      verified: business.isVerified,
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
        ...(business_name && { business_name }),
        ...(owner_name && { owner_name }),
        ...(phone_number && { phone_number }),
        ...(postal_address && { postal_address }),
        ...(location && {
          locationLat: location.lat,
          locationLon: location.lon,
        }),
        ...(avatar && { avatar }),
        ...(biography && { biography }),
      },
    });

    return res.json({
      ...(business_name && { business_name: b.business_name }),
      ...(owner_name && { owner_name: b.owner_name }),
      ...(phone_number && { phone_number: b.phone_number }),
      ...(postal_address && { postal_address: b.postal_address }),
      ...(location && { location: { lat: b.locationLat, lon: b.locationLon } }),
      ...(avatar && { avatar: b.avatar }),
      ...(biography && { biography: b.biography }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { GET, PATCH };
