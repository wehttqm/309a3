const { prisma } = require("../../utils/prisma_client.js");

const POST = async (req, res) => {
  const required_fields = [
    "business_name",
    "owner_name",
    "email",
    "password",
    "phone_number",
    "postal_address",
    "location",
  ];

  const is_missing = required_fields.some((field) => !req.body[field]);

  if (is_missing) {
    return res.status(400).json({ message: "Invalid payload." });
  }

  try {
    const {
      business_name,
      owner_name,
      email,
      password,
      phone_number,
      postal_address,
      location,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    if (!location.lat || !location.lon) {
      return res.status(400).json({ message: "Invalid payload." });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // expires in 7 days

    const business = await prisma.user.create({
      data: {
        email,
        password,
        role: "business",

        business_name,
        owner_name,
        phone_number,
        postal_address,
        locationLat: location.lat,
        locationLon: location.lon,
        expiresAt,
      },
    });

    const entries = [
      "id",
      "business_name",
      "owner_name",
      "email",
      "activated",
      "verified",
      "role",
      "phone_number",
      "postal_address",
      "createdAt",
      "resetToken",
      "expiresAt",
    ];
    const filteredBusiness = {
      ...Object.fromEntries(
        Object.entries(business).filter(([key]) => entries.includes(key)),
      ),
      location: {
        lat: business.locationLat,
        lon: business.locationLon,
      },
    };

    return res.status(201).json(filteredBusiness);
  } catch (error) {
    console.error("Auth Resets Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

async function GET(req, res) {
  try {
    const {
      keyword = "", // IF ADMIN: this also filters owner_name
      activated, // ADMIN ONLY
      verified, // ADMIN ONLY
      sort, // can be "owner_name" ONLY IF ADMIN
      order,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10), 1);
    const pageSize = Math.max(parseInt(limit, 10), 1);

    const isAdmin = req.auth && req.auth.role === "admin";

    if (
      !isAdmin &&
      (activated !== undefined ||
        verified !== undefined ||
        sort === "owner_name")
    ) {
      return res
        .status(400)
        .json({ error: "Must be admin to use these parameters" });
    }

    const searchFields = [
      { business_name: { contains: keyword } },
      { email: { contains: keyword } },
      { postal_address: { contains: keyword } },
      { phone_number: { contains: keyword } },
    ];

    if (isAdmin) {
      searchFields.push({ owner_name: { contains: keyword } });
    }

    const filters = {
      role: "business",
      ...(activated !== undefined && { activated: activated === "true" }),
      ...(verified !== undefined && { verified: verified === "true" }),
      ...(keyword && { OR: searchFields }),
    };

    const sort_options = ["business_name", "email", "owner_name"];
    let orderBy = {};
    if (sort && sort_options.some((o) => sort == o)) {
      orderBy[sort] = order === "desc" ? "desc" : "asc";
    }

    const [count, results] = await Promise.all([
      prisma.user.count({ where: filters }),
      prisma.user.findMany({
        where: filters,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: sort ? orderBy : undefined, // Do not sort by default per spec
      }),
    ]);

    // Non-admins should NOT see owner_name, verified, or activated
    const sanitizedResults = results.map((b) => {
      if (isAdmin) return b;
      const { owner_name, verified, activated, ...everything_else } = b;
      return everything_else;
    });

    return res.json({ count, results: sanitizedResults });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { GET, POST };
