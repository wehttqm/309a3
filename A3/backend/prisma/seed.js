"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PASSWORD = "123123";
const NOW = new Date();
const EXPIRES_AT = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000);

function iso(date) {
  return new Date(date).toISOString();
}

function addDays(base, days, hour = 9) {
  const value = new Date(base);
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  return value;
}

function addHours(base, hours) {
  return new Date(new Date(base).getTime() + hours * 60 * 60 * 1000);
}

async function resetDatabase() {
  await prisma.negotiation.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.qualification.deleteMany();
  await prisma.positionType.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name IN ('User','PositionType','Qualification','JobPosting','Negotiation','Interest')`);
  } catch (error) {
    // Ignore if sqlite_sequence is unavailable.
  }
}

async function createSettings() {
  const settings = [
    ["reset-cooldown", "60"],
    ["job-start-window", "168"],
    ["negotiation-window", "900"],
    ["availability-timeout", "300"],
  ];

  for (const [key, value] of settings) {
    await prisma.systemSetting.create({ data: { key, value } });
  }
}

async function createPositionTypes() {
  const definitions = [
    ["Dental Assistant (Level 1)", "Entry-level chairside and sterilization support.", false],
    ["Dental Assistant (Level 2)", "Expanded-duty dental assisting.", false],
    ["Dental Hygienist", "Preventive oral care and scaling appointments.", false],
    ["Reception / Front Desk", "Patient scheduling, billing, and front-desk support.", false],
    ["Treatment Coordinator", "Patient communication and treatment planning support.", false],
    ["Sterilization Technician", "Instrument reprocessing and sterilization workflow.", false],
    ["Dental Administrator", "Office administration and insurance coordination.", false],
    ["Orthodontic Assistant", "Orthodontic chairside support.", false],
    ["Oral Surgery Assistant", "Surgical setup and sedation support.", false],
    ["Clinical Floater", "Cross-functional clinic support across departments.", true],
  ];

  const positionTypes = [];
  for (const [name, description, hidden] of definitions) {
    positionTypes.push(
      await prisma.positionType.create({ data: { name, description, hidden } }),
    );
  }

  return positionTypes;
}

async function createAdmin() {
  return prisma.user.create({
    data: {
      email: "admin1@csc309.utoronto.ca",
      password: PASSWORD,
      role: "admin",
      activated: true,
      suspended: false,
      verified: false,
      available: false,
      lastActive: NOW,
      first_name: "Avery",
      last_name: "Admin",
      phone_number: "416-555-9001",
      postal_address: "40 St George St, Toronto, ON",
      biography: "Primary seeded administrator account.",
      resetToken: "seed-admin-1",
      expiresAt: EXPIRES_AT,
    },
  });
}

async function createBusinesses() {
  const businesses = [];
  const businessNames = [
    "Bloor Dental Group",
    "Harbourfront Smiles",
    "Annex Family Dental",
    "Queen West Ortho",
    "Midtown Dental Studio",
    "Maple Leaf Oral Surgery",
    "Liberty Village Dental",
    "Yorkville Dental Care",
    "Riverside Dentistry",
    "Leslieville Dental Loft",
  ];

  for (let i = 1; i <= 10; i += 1) {
    const activated = i !== 10;
    const verified = i <= 8;
    const business = await prisma.user.create({
      data: {
        email: `business${i}@csc309.utoronto.ca`,
        password: PASSWORD,
        role: "business",
        activated,
        verified,
        suspended: false,
        available: false,
        lastActive: addHours(NOW, -i),
        business_name: businessNames[i - 1],
        owner_name: `Owner ${i}`,
        phone_number: `416-555-22${String(i).padStart(2, "0")}`,
        postal_address: `${100 + i} Queen St W, Toronto, ON`,
        locationLat: 43.64 + i * 0.004,
        locationLon: -79.40 + i * 0.003,
        biography: `${businessNames[i - 1]} is a seeded clinic account for workflow and pagination testing.`,
        avatar: `/uploads/businesses/business${i}-avatar.png`,
        resetToken: `seed-business-${i}`,
        expiresAt: EXPIRES_AT,
      },
    });

    businesses.push(business);
  }

  return businesses;
}

async function createRegularUsers() {
  const firstNames = [
    "Alice", "Ben", "Chloe", "Daniel", "Emma", "Farah", "Gavin", "Hana", "Isaac", "Jasmin",
    "Kai", "Leah", "Mason", "Nina", "Owen", "Priya", "Quinn", "Riley", "Sara", "Tyler",
  ];
  const lastNames = [
    "Ng", "Patel", "Li", "Brown", "Ahmed", "Kim", "Lopez", "Singh", "Wilson", "Martin",
    "Taylor", "Garcia", "Chan", "Khan", "Wright", "Scott", "Young", "Hall", "Allen", "Moore",
  ];

  const users = [];
  for (let i = 1; i <= 20; i += 1) {
    const activated = i !== 19;
    const suspended = i === 18;
    const available = i <= 12 && i !== 8 && !suspended && activated;
    const lastActive = i === 20 ? addHours(NOW, -12) : addMinutes(NOW, -(i * 3));

    const user = await prisma.user.create({
      data: {
        email: `regular${i}@csc309.utoronto.ca`,
        password: PASSWORD,
        role: "regular",
        activated,
        suspended,
        verified: false,
        available,
        lastActive,
        first_name: firstNames[i - 1],
        last_name: lastNames[i - 1],
        phone_number: `647-555-11${String(i).padStart(2, "0")}`,
        postal_address: `${10 + i} College St, Toronto, ON`,
        birthday: `199${i % 10}-0${(i % 9) + 1}-15`,
        avatar: `/uploads/users/regular${i}-avatar.png`,
        resume: `/uploads/users/regular${i}-resume.pdf`,
        biography: `Seeded regular user ${i} for qualification, job, and negotiation workflows.`,
        resetToken: `seed-regular-${i}`,
        expiresAt: EXPIRES_AT,
      },
    });

    users.push(user);
  }

  return users;
}

function addMinutes(base, minutes) {
  return new Date(new Date(base).getTime() + minutes * 60 * 1000);
}

async function createQualifications(users, positionTypes) {
  const qualificationRows = [];

  for (let i = 0; i < 10; i += 1) {
    qualificationRows.push({
      userId: users[i].id,
      positionTypeId: positionTypes[i % positionTypes.length].id,
      status: "approved",
      note: `Approved qualification for regular${i + 1}.`,
      document: `/uploads/users/regular${i + 1}-qualification-a.pdf`,
      updatedAt: addHours(NOW, -(i + 1)),
    });
    qualificationRows.push({
      userId: users[i].id,
      positionTypeId: positionTypes[(i + 1) % positionTypes.length].id,
      status: "approved",
      note: `Second approved qualification for regular${i + 1}.`,
      document: `/uploads/users/regular${i + 1}-qualification-b.pdf`,
      updatedAt: addHours(NOW, -(i + 2)),
    });
  }

  qualificationRows.push(
    {
      userId: users[10].id,
      positionTypeId: positionTypes[2].id,
      status: "submitted",
      note: "Awaiting admin review.",
      document: "/uploads/users/regular11-qualification.pdf",
      updatedAt: addHours(NOW, -6),
    },
    {
      userId: users[11].id,
      positionTypeId: positionTypes[3].id,
      status: "revised",
      note: "Revised submission ready for admin attention.",
      document: "/uploads/users/regular12-qualification.pdf",
      updatedAt: addHours(NOW, -5),
    },
    {
      userId: users[12].id,
      positionTypeId: positionTypes[4].id,
      status: "created",
      note: "Draft qualification request.",
      document: null,
      updatedAt: addHours(NOW, -4),
    },
    {
      userId: users[13].id,
      positionTypeId: positionTypes[5].id,
      status: "rejected",
      note: "Rejected qualification request for testing revision flow.",
      document: "/uploads/users/regular14-qualification.pdf",
      updatedAt: addHours(NOW, -3),
    },
    {
      userId: users[14].id,
      positionTypeId: positionTypes[6].id,
      status: "approved",
      note: "Approved admin qualification.",
      document: "/uploads/users/regular15-qualification.pdf",
      updatedAt: addHours(NOW, -2),
    },
    {
      userId: users[15].id,
      positionTypeId: positionTypes[7].id,
      status: "approved",
      note: "Approved orthodontic assistant qualification.",
      document: "/uploads/users/regular16-qualification.pdf",
      updatedAt: addHours(NOW, -1),
    },
  );

  await prisma.qualification.createMany({ data: qualificationRows });
}

async function createJobs(businesses, users, positionTypes) {
  const jobs = [];

  for (let b = 0; b < 8; b += 1) {
    for (let j = 0; j < 3; j += 1) {
      jobs.push(
        await prisma.jobPosting.create({
          data: {
            businessId: businesses[b].id,
            positionTypeId: positionTypes[(b + j) % 8].id,
            salaryMin: 28 + j,
            salaryMax: 34 + j,
            startTime: addDays(NOW, b + j + 1, 8 + j),
            endTime: addDays(NOW, b + j + 1, 16 + j),
            note: `Open seeded job ${jobs.length + 1} for ${businesses[b].business_name}.`,
            status: "open",
          },
        }),
      );
    }
  }

  jobs.push(
    await prisma.jobPosting.create({
      data: {
        businessId: businesses[0].id,
        positionTypeId: positionTypes[0].id,
        filledByUserId: users[5].id,
        salaryMin: 36,
        salaryMax: 42,
        startTime: addDays(NOW, 2, 9),
        endTime: addDays(NOW, 2, 17),
        note: "Filled future shift for candidate history testing.",
        status: "filled",
      },
    }),
    await prisma.jobPosting.create({
      data: {
        businessId: businesses[1].id,
        positionTypeId: positionTypes[1].id,
        filledByUserId: users[0].id,
        salaryMin: 37,
        salaryMax: 43,
        startTime: addHours(NOW, -2),
        endTime: addHours(NOW, 4),
        note: "NO-SHOW TEST: in-progress filled job for business2.",
        status: "filled",
      },
    }),
    await prisma.jobPosting.create({
      data: {
        businessId: businesses[2].id,
        positionTypeId: positionTypes[2].id,
        filledByUserId: users[1].id,
        salaryMin: 35,
        salaryMax: 41,
        startTime: addDays(NOW, -2, 8),
        endTime: addDays(NOW, -2, 16),
        note: "Completed seeded job 1.",
        status: "completed",
      },
    }),
    await prisma.jobPosting.create({
      data: {
        businessId: businesses[3].id,
        positionTypeId: positionTypes[3].id,
        filledByUserId: users[2].id,
        salaryMin: 35,
        salaryMax: 41,
        startTime: addDays(NOW, -4, 10),
        endTime: addDays(NOW, -4, 18),
        note: "Completed seeded job 2.",
        status: "completed",
      },
    }),
    await prisma.jobPosting.create({
      data: {
        businessId: businesses[4].id,
        positionTypeId: positionTypes[4].id,
        filledByUserId: users[3].id,
        salaryMin: 32,
        salaryMax: 38,
        startTime: addDays(NOW, -1, 8),
        endTime: addDays(NOW, -1, 16),
        note: "Canceled seeded job 1.",
        status: "canceled",
      },
    }),
    await prisma.jobPosting.create({
      data: {
        businessId: businesses[5].id,
        positionTypeId: positionTypes[5].id,
        filledByUserId: users[4].id,
        salaryMin: 33,
        salaryMax: 39,
        startTime: addDays(NOW, -3, 11),
        endTime: addDays(NOW, -3, 19),
        note: "Canceled seeded job 2.",
        status: "canceled",
      },
    }),
  );

  return jobs;
}

async function createInterestAndNegotiationScenarios(users, businesses, jobs) {
  const activeInterestA = await prisma.interest.create({
    data: {
      userId: users[0].id,
      jobId: jobs[0].id,
      candidateInterested: true,
      businessInterested: true,
    },
  });

  await prisma.negotiation.create({
    data: {
      jobId: jobs[0].id,
      userId: users[0].id,
      interestId: activeInterestA.id,
      expiresAt: addHours(NOW, 6),
      status: "active",
    },
  });

  const activeInterestB = await prisma.interest.create({
    data: {
      userId: users[1].id,
      jobId: jobs[3].id,
      candidateInterested: true,
      businessInterested: true,
    },
  });

  await prisma.negotiation.create({
    data: {
      jobId: jobs[3].id,
      userId: users[1].id,
      interestId: activeInterestB.id,
      expiresAt: addHours(NOW, 5),
      status: "active",
      candidateDecision: "accept",
      businessDecision: null,
    },
  });

  await prisma.interest.create({
    data: {
      userId: users[2].id,
      jobId: jobs[6].id,
      candidateInterested: true,
      businessInterested: true,
    },
  });

  await prisma.interest.create({
    data: {
      userId: users[3].id,
      jobId: jobs[7].id,
      candidateInterested: true,
      businessInterested: false,
    },
  });

  await prisma.interest.create({
    data: {
      userId: users[4].id,
      jobId: jobs[8].id,
      candidateInterested: false,
      businessInterested: true,
    },
  });

  await prisma.interest.create({
    data: {
      userId: users[5].id,
      jobId: jobs[24].id,
      candidateInterested: null,
      businessInterested: null,
    },
  });

  await prisma.negotiation.create({
    data: {
      jobId: jobs[24].id,
      userId: users[5].id,
      interestId: null,
      expiresAt: addHours(NOW, -24),
      status: "success",
      candidateDecision: "accept",
      businessDecision: "accept",
    },
  });

  await prisma.interest.create({
    data: {
      userId: users[6].id,
      jobId: jobs[9].id,
      candidateInterested: null,
      businessInterested: null,
    },
  });

  await prisma.negotiation.create({
    data: {
      jobId: jobs[9].id,
      userId: users[6].id,
      interestId: null,
      expiresAt: addHours(NOW, -10),
      status: "failed",
      candidateDecision: "decline",
      businessDecision: null,
    },
  });

  await prisma.interest.create({
    data: {
      userId: users[7].id,
      jobId: jobs[10].id,
      candidateInterested: true,
      businessInterested: true,
    },
  });

  await prisma.interest.create({
    data: {
      userId: users[8].id,
      jobId: jobs[11].id,
      candidateInterested: false,
      businessInterested: true,
    },
  });

  await prisma.interest.create({
    data: {
      userId: users[9].id,
      jobId: jobs[12].id,
      candidateInterested: true,
      businessInterested: false,
    },
  });
}

async function main() {
  await resetDatabase();
  await createSettings();
  const positionTypes = await createPositionTypes();
  await createAdmin();
  const businesses = await createBusinesses();
  const users = await createRegularUsers();
  await createQualifications(users, positionTypes);
  const jobs = await createJobs(businesses, users, positionTypes);
  await createInterestAndNegotiationScenarios(users, businesses, jobs);

  console.log("Seed complete.");
  console.log("Admin: admin1@csc309.utoronto.ca / 123123");
  console.log("Regular users: regular1@csc309.utoronto.ca ... regular20@csc309.utoronto.ca / 123123");
  console.log("Businesses: business1@csc309.utoronto.ca ... business10@csc309.utoronto.ca / 123123");
  console.log("Active negotiations:");
  console.log("  regular1@csc309.utoronto.ca <-> business1@csc309.utoronto.ca");
  console.log("  regular2@csc309.utoronto.ca <-> business2@csc309.utoronto.ca");
  console.log("Ready-to-start mutual match:");
  console.log("  regular3@csc309.utoronto.ca <-> business3@csc309.utoronto.ca");
  console.log("No-show test:");
  console.log("  business2@csc309.utoronto.ca has an in-progress filled job assigned to regular1@csc309.utoronto.ca");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
