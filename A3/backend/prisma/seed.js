/*
 * Seed data for local development.
 *
 * Goals:
 * - provide one activated regular user that can browse jobs immediately
 * - provide multiple activated + verified businesses
 * - provide approved qualifications for the regular user
 * - provide open jobs from multiple businesses that match those qualifications
 */
"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function addDays(baseDate, days, hour = 9) {
  const value = new Date(baseDate);
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  return value;
}

async function upsertSetting(key, value) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

async function main() {
  const now = new Date();
  const expiryDate = addDays(now, 1, 23);

  // Reset non-user data so repeated seeds stay predictable.
  await prisma.negotiation.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.qualification.deleteMany();
  await prisma.positionType.deleteMany();

  const regularUser = await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {
      first_name: "User",
      last_name: "One",
      password: "testTEST1234!",
      role: "regular",
      activated: true,
      suspended: false,
      available: true,
      verified: false,
      phone_number: "416-555-0101",
      postal_address: "100 College St, Toronto, ON",
      biography: "Seeded regular user for local testing.",
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef3",
      expiresAt: expiryDate,
      lastActive: now,
    },
    create: {
      email: "user1@example.com",
      first_name: "User",
      last_name: "One",
      password: "testTEST1234!",
      role: "regular",
      activated: true,
      suspended: false,
      available: true,
      phone_number: "416-555-0101",
      postal_address: "100 College St, Toronto, ON",
      biography: "Seeded regular user for local testing.",
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef3",
      expiresAt: expiryDate,
      lastActive: now,
    },
  });

  await prisma.user.upsert({
    where: { email: "user2@example.com" },
    update: {
      first_name: "User",
      last_name: "Admin",
      password: "testTEST1234!",
      role: "admin",
      activated: true,
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef4",
      expiresAt: expiryDate,
      lastActive: now,
    },
    create: {
      email: "user2@example.com",
      first_name: "User",
      last_name: "Admin",
      password: "testTEST1234!",
      role: "admin",
      activated: true,
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef4",
      expiresAt: expiryDate,
      lastActive: now,
    },
  });

  const businessOne = await prisma.user.upsert({
    where: { email: "user3@example.com" },
    update: {
      password: "testTEST1234!",
      role: "business",
      activated: true,
      verified: true,
      business_name: "Northwind Staffing",
      owner_name: "Nadia Noor",
      phone_number: "416-555-0201",
      postal_address: "200 Front St W, Toronto, ON",
      locationLat: 43.6455,
      locationLon: -79.3807,
      biography: "Warehouse and logistics shifts across downtown Toronto.",
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef5",
      expiresAt: expiryDate,
      lastActive: now,
    },
    create: {
      email: "user3@example.com",
      password: "testTEST1234!",
      role: "business",
      activated: true,
      verified: true,
      business_name: "Northwind Staffing",
      owner_name: "Nadia Noor",
      phone_number: "416-555-0201",
      postal_address: "200 Front St W, Toronto, ON",
      locationLat: 43.6455,
      locationLon: -79.3807,
      biography: "Warehouse and logistics shifts across downtown Toronto.",
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef5",
      expiresAt: expiryDate,
      lastActive: now,
    },
  });

  const businessTwo = await prisma.user.upsert({
    where: { email: "user4@example.com" },
    update: {
      password: "testTEST1234!",
      role: "business",
      activated: true,
      verified: true,
      business_name: "Maple Works Co",
      owner_name: "Maya Patel",
      phone_number: "416-555-0202",
      postal_address: "55 Queen St E, Toronto, ON",
      locationLat: 43.6526,
      locationLon: -79.3748,
      biography: "General labour and light industrial placements.",
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef6",
      expiresAt: expiryDate,
      lastActive: now,
    },
    create: {
      email: "user4@example.com",
      password: "testTEST1234!",
      role: "business",
      activated: true,
      verified: true,
      business_name: "Maple Works Co",
      owner_name: "Maya Patel",
      phone_number: "416-555-0202",
      postal_address: "55 Queen St E, Toronto, ON",
      locationLat: 43.6526,
      locationLon: -79.3748,
      biography: "General labour and light industrial placements.",
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef6",
      expiresAt: expiryDate,
      lastActive: now,
    },
  });

  const businessThree = await prisma.user.upsert({
    where: { email: "user5@example.com" },
    update: {
      password: "testTEST1234!",
      role: "business",
      activated: true,
      verified: true,
      business_name: "Harbour Industrial",
      owner_name: "Hassan Lee",
      phone_number: "416-555-0203",
      postal_address: "10 Commissioners St, Toronto, ON",
      locationLat: 43.6401,
      locationLon: -79.3417,
      biography: "Forklift, shipping, and dock operations roles.",
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef7",
      expiresAt: expiryDate,
      lastActive: now,
    },
    create: {
      email: "user5@example.com",
      password: "testTEST1234!",
      role: "business",
      activated: true,
      verified: true,
      business_name: "Harbour Industrial",
      owner_name: "Hassan Lee",
      phone_number: "416-555-0203",
      postal_address: "10 Commissioners St, Toronto, ON",
      locationLat: 43.6401,
      locationLon: -79.3417,
      biography: "Forklift, shipping, and dock operations roles.",
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef7",
      expiresAt: expiryDate,
      lastActive: now,
    },
  });

  await upsertSetting("reset-cooldown", "1");
  await upsertSetting("job-start-window", "168");
  await upsertSetting("negotiation-window", "900");
  await upsertSetting("availability-timeout", "60");

  const generalLabour = await prisma.positionType.create({
    data: {
      name: "General Labour",
      description: "Entry-level warehouse and labour shifts.",
      hidden: false,
    },
  });

  const warehouseAssociate = await prisma.positionType.create({
    data: {
      name: "Warehouse Associate",
      description: "Picking, packing, and warehouse support work.",
      hidden: false,
    },
  });

  const dockSupport = await prisma.positionType.create({
    data: {
      name: "Dock Support",
      description: "Shipping, receiving, and loading assistance.",
      hidden: false,
    },
  });

  await prisma.qualification.createMany({
    data: [
      {
        userId: regularUser.id,
        positionTypeId: generalLabour.id,
        status: "approved",
        note: "Seeded approved qualification",
      },
      {
        userId: regularUser.id,
        positionTypeId: warehouseAssociate.id,
        status: "approved",
        note: "Seeded approved qualification",
      },
      {
        userId: regularUser.id,
        positionTypeId: dockSupport.id,
        status: "approved",
        note: "Seeded approved qualification",
      },
    ],
  });

  await prisma.jobPosting.createMany({
    data: [
      {
        businessId: businessOne.id,
        positionTypeId: generalLabour.id,
        salaryMin: 18,
        salaryMax: 21,
        startTime: addDays(now, 2, 8),
        endTime: addDays(now, 2, 16),
        note: "Morning loading crew",
        status: "open",
      },
      {
        businessId: businessOne.id,
        positionTypeId: warehouseAssociate.id,
        salaryMin: 20,
        salaryMax: 24,
        startTime: addDays(now, 3, 9),
        endTime: addDays(now, 3, 17),
        note: "Packing and inventory support",
        status: "open",
      },
      {
        businessId: businessTwo.id,
        positionTypeId: generalLabour.id,
        salaryMin: 19,
        salaryMax: 22,
        startTime: addDays(now, 4, 7),
        endTime: addDays(now, 4, 15),
        note: "Production floor support",
        status: "open",
      },
      {
        businessId: businessTwo.id,
        positionTypeId: warehouseAssociate.id,
        salaryMin: 21,
        salaryMax: 25,
        startTime: addDays(now, 5, 10),
        endTime: addDays(now, 5, 18),
        note: "Afternoon warehouse shift",
        status: "open",
      },
      {
        businessId: businessThree.id,
        positionTypeId: dockSupport.id,
        salaryMin: 22,
        salaryMax: 26,
        startTime: addDays(now, 6, 6),
        endTime: addDays(now, 6, 14),
        note: "Receiving and dock assistance",
        status: "open",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Regular user: user1@example.com / testTEST1234!");
  console.log("Businesses: user3@example.com, user4@example.com, user5@example.com / testTEST1234!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });