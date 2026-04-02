const { prisma } = require("../../utils/prisma_client.js");

async function POST(req, res) {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone_number = "",
      postal_address = "",
      birthday = "1970-01-01",
    } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // expires in 7 days

    const user = await prisma.user.create({
      data: {
        // Required
        first_name,
        last_name,
        email,
        password,

        // Optional
        phone_number,
        postal_address,
        birthday,
        expiresAt,
      },
    });

    // Return response
    return res.status(201).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      activated: user.activated,
      role: user.role,
      phone_number: user.phone_number,
      postal_address: user.postal_address,
      birthday: user.birthday,
      createdAt: user.createdAt,
      resetToken: user.resetToken,
      expiresAt: user.expiresAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function GET(req, res) {
  try {
    const {
      keyword = "",
      activated,
      suspended,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10), 1);
    const pageSize = Math.max(parseInt(limit, 10), 1);

    const filters = {
      role: "regular",
      ...(activated !== undefined ? { activated: activated === "true" } : {}),
      ...(suspended !== undefined ? { suspended: suspended === "true" } : {}),
      ...(keyword
        ? {
            OR: [
              { first_name: { contains: keyword } },
              { last_name: { contains: keyword } },
              { email: { contains: keyword } },
              { postal_address: { contains: keyword } },
              { phone_number: { contains: keyword } },
            ],
          }
        : {}),
    };

    // Count total matching users
    const count = await prisma.user.count({ where: filters });

    // Fetch paginated results
    const results = await prisma.user.findMany({
      where: filters,
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        activated: true,
        suspended: true,
        role: true,
        phone_number: true,
        postal_address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ count, results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { GET, POST };
