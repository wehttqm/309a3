/*
 * Seed data for local development.
 *
 * Negotiation testing scenarios included:
 * 1. Active negotiation: user1 <-> user4
 * 2. Active negotiation: user6 <-> user5
 * 3. Mutual interest only (no negotiation yet): user7 <-> user3
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

function addHours(baseDate, hours) {
  const value = new Date(baseDate);
  value.setTime(value.getTime() + hours * 60 * 60 * 1000);
  return value;
}

async function upsertSetting(key, value) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

async function upsertRegularUser({
  email,
  first_name,
  last_name,
  phone_number,
  postal_address,
  biography,
  resetToken,
  expiresAt,
  lastActive,
  available = true,
}) {
  return prisma.user.upsert({
    where: { email },
    update: {
      first_name,
      last_name,
      password: "testTEST1234!",
      role: "regular",
      activated: true,
      suspended: false,
      available,
      verified: false,
      phone_number,
      postal_address,
      biography,
      resetToken,
      expiresAt,
      lastActive,
    },
    create: {
      email,
      first_name,
      last_name,
      password: "testTEST1234!",
      role: "regular",
      activated: true,
      suspended: false,
      available,
      phone_number,
      postal_address,
      biography,
      resetToken,
      expiresAt,
      lastActive,
    },
  });
}

async function main() {
  const now = new Date();
  const expiryDate = addDays(now, 1, 23);

  await prisma.negotiation.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.qualification.deleteMany();
  await prisma.positionType.deleteMany();

  const regularUser = await upsertRegularUser({
    email: "user1@example.com",
    first_name: "User",
    last_name: "One",
    phone_number: "416-555-0101",
    postal_address: "100 College St, Toronto, ON",
    biography: "Seeded regular user for local testing.",
    resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef3",
    expiresAt: expiryDate,
    lastActive: now,
  });

  const discoverableCandidate = await upsertRegularUser({
    email: "user6@example.com",
    first_name: "Casey",
    last_name: "Nguyen",
    phone_number: "416-555-0106",
    postal_address: "75 Dundas St W, Toronto, ON",
    biography: "Available and qualified candidate for business candidate search.",
    resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef8",
    expiresAt: expiryDate,
    lastActive: now,
  });

  const interestedCandidate = await upsertRegularUser({
    email: "user7@example.com",
    first_name: "Jordan",
    last_name: "Kim",
    phone_number: "416-555-0107",
    postal_address: "300 King St W, Toronto, ON",
    biography: "Candidate seeded for mutual-interest negotiation start testing.",
    resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef9",
    expiresAt: expiryDate,
    lastActive: now,
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
      {
        userId: discoverableCandidate.id,
        positionTypeId: generalLabour.id,
        status: "approved",
        note: "Discoverable candidate qualification",
      },
      {
        userId: discoverableCandidate.id,
        positionTypeId: warehouseAssociate.id,
        status: "approved",
        note: "Discoverable candidate qualification",
      },
      {
        userId: discoverableCandidate.id,
        positionTypeId: dockSupport.id,
        status: "approved",
        note: "Discoverable candidate qualification",
      },
      {
        userId: interestedCandidate.id,
        positionTypeId: generalLabour.id,
        status: "approved",
        note: "Interested candidate qualification",
      },
      {
        userId: interestedCandidate.id,
        positionTypeId: warehouseAssociate.id,
        status: "approved",
        note: "Interested candidate qualification",
      },
    ],
  });

  const openJobs = await prisma.jobPosting.createManyAndReturn
    ? await prisma.jobPosting.createManyAndReturn({
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
      })
    : null;

  if (!openJobs) {
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
  }

  const businessOneOpenGeneral = await prisma.jobPosting.findFirst({
    where: {
      businessId: businessOne.id,
      positionTypeId: generalLabour.id,
      status: "open",
      note: "Morning loading crew",
    },
  });

  const businessTwoOpenWarehouse = await prisma.jobPosting.findFirst({
    where: {
      businessId: businessTwo.id,
      positionTypeId: warehouseAssociate.id,
      status: "open",
      note: "Afternoon warehouse shift",
    },
  });

  const businessThreeOpenDock = await prisma.jobPosting.findFirst({
    where: {
      businessId: businessThree.id,
      positionTypeId: dockSupport.id,
      status: "open",
      note: "Receiving and dock assistance",
    },
  });

  await prisma.jobPosting.createMany({
    data: [
      {
        businessId: businessOne.id,
        positionTypeId: generalLabour.id,
        filledByUserId: regularUser.id,
        salaryMin: 23,
        salaryMax: 27,
        startTime: addDays(now, 1, 9),
        endTime: addDays(now, 1, 17),
        note: "Upcoming filled shift for /my/jobs testing",
        status: "filled",
      },
      {
        businessId: businessTwo.id,
        positionTypeId: warehouseAssociate.id,
        filledByUserId: regularUser.id,
        salaryMin: 24,
        salaryMax: 28,
        startTime: addHours(now, -2),
        endTime: addHours(now, 4),
        note: "Active in-progress shift for /my/jobs testing and business no-show testing",
        status: "filled",
      },
      {
        businessId: businessThree.id,
        positionTypeId: dockSupport.id,
        filledByUserId: regularUser.id,
        salaryMin: 25,
        salaryMax: 29,
        startTime: addDays(now, -3, 8),
        endTime: addDays(now, -3, 16),
        note: "Completed shift for /my/jobs testing",
        status: "completed",
      },
      {
        businessId: businessOne.id,
        positionTypeId: generalLabour.id,
        filledByUserId: regularUser.id,
        salaryMin: 22,
        salaryMax: 24,
        startTime: addDays(now, -1, 9),
        endTime: addDays(now, -1, 17),
        note: "Canceled commitment for /my/jobs testing",
        status: "canceled",
      },
    ],
  });

  // Active negotiation A: user1 <-> businessTwo (user4)
  const negotiationJobA = await prisma.jobPosting.create({
    data: {
      businessId: businessTwo.id,
      positionTypeId: warehouseAssociate.id,
      salaryMin: 26,
      salaryMax: 30,
      startTime: addDays(now, 2, 12),
      endTime: addDays(now, 2, 20),
      note: "Active negotiation seed job A",
      status: "open",
    },
  });

  const mutualInterestA = await prisma.interest.create({
    data: {
      userId: regularUser.id,
      jobId: negotiationJobA.id,
      candidateInterested: true,
      businessInterested: true,
    },
  });

  await prisma.negotiation.create({
    data: {
      jobId: negotiationJobA.id,
      userId: regularUser.id,
      interestId: mutualInterestA.id,
      status: "active",
      expiresAt: addHours(now, 6),
      candidateDecision: null,
      businessDecision: null,
    },
  });

  // Active negotiation B: user6 <-> businessThree (user5)
  const negotiationJobB = await prisma.jobPosting.create({
    data: {
      businessId: businessThree.id,
      positionTypeId: dockSupport.id,
      salaryMin: 27,
      salaryMax: 31,
      startTime: addDays(now, 3, 11),
      endTime: addDays(now, 3, 19),
      note: "Active negotiation seed job B",
      status: "open",
    },
  });

  const mutualInterestB = await prisma.interest.create({
    data: {
      userId: discoverableCandidate.id,
      jobId: negotiationJobB.id,
      candidateInterested: true,
      businessInterested: true,
    },
  });

  await prisma.negotiation.create({
    data: {
      jobId: negotiationJobB.id,
      userId: discoverableCandidate.id,
      interestId: mutualInterestB.id,
      status: "active",
      expiresAt: addHours(now, 5),
      candidateDecision: null,
      businessDecision: null,
    },
  });

  // Mutual interest only, no negotiation yet: user7 <-> businessOne (user3)
  if (businessOneOpenGeneral) {
    await prisma.interest.create({
      data: {
        userId: interestedCandidate.id,
        jobId: businessOneOpenGeneral.id,
        candidateInterested: true,
        businessInterested: true,
      },
    });
  }

  // One-sided business interest for business candidate workflow.
  if (businessTwoOpenWarehouse) {
    await prisma.interest.create({
      data: {
        userId: interestedCandidate.id,
        jobId: businessTwoOpenWarehouse.id,
        candidateInterested: false,
        businessInterested: true,
      },
    });
  }

  // One-sided candidate interest for another open job.
  if (businessThreeOpenDock) {
    await prisma.interest.create({
      data: {
        userId: regularUser.id,
        jobId: businessThreeOpenDock.id,
        candidateInterested: true,
        businessInterested: false,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Active negotiation A:");
  console.log("  regular  user1@example.com / testTEST1234!");
  console.log("  business user4@example.com / testTEST1234!");
  console.log("Active negotiation B:");
  console.log("  regular  user6@example.com / testTEST1234!");
  console.log("  business user5@example.com / testTEST1234!");
  console.log("Mutual interest only, ready to start negotiation:");
  console.log("  regular  user7@example.com / testTEST1234!");
  console.log("  business user3@example.com / testTEST1234!");
  console.log("Admin: user2@example.com / testTEST1234!");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })