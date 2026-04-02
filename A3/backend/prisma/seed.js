/*
 * If you need to initialize your database with some data, you may write a script
 * to do so here.
 */
"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24);

  await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {},
    create: {
      email: "user1@example.com",
      first_name: "User",
      last_name: "1",
      password: "testTEST1234!",
      role: "regular",
      activated: false,
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef3",
      expiresAt: expiryDate,
      lastActive: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "user2@example.com" },
    update: {},
    create: {
      email: "user2@example.com",
      first_name: "User",
      last_name: "2",
      password: "testTEST1234!",
      role: "admin",
      activated: false,
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef4",
      expiresAt: expiryDate,
      lastActive: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "user3@example.com" },
    update: {},
    create: {
      email: "user3@example.com",
      first_name: "User",
      last_name: "3",
      password: "testTEST1234!",
      role: "business",
      activated: false,
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef4",
      expiresAt: expiryDate,
      lastActive: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "user4@example.com" },
    update: {},
    create: {
      email: "user4@example.com",
      first_name: "User",
      last_name: "4",
      password: "testTEST1234!",
      role: "business",
      activated: false,
      resetToken: "de90849c-9ab7-494e-a022-8c0d9dae0ef4",
      expiresAt: expiryDate,
      lastActive: new Date(),
    },
  });

  await prisma.systemSetting.create({
    data: {
      key: "reset-cooldown",
      value: "1",
    },
  });

  await prisma.systemSetting.create({
    data: {
      key: "job-start-window",
      value: "168",
    },
  });

  await prisma.systemSetting.create({
    data: {
      key: "negotiation-window",
      value: "900",
    },
  });
  await prisma.systemSetting.create({
    data: {
      key: "availability-timeout",
      value: "60",
    },
  });

  await prisma.positionType.create({
    data: {
      name: "seed test",
      description: "test",
      hidden: false,
    },
  });

  await prisma.jobPosting.create({
    data: {
      salaryMin: 1,
      salaryMax: 1,
      startTime: new Date("2026-03-31"),
      endTime: new Date("2026-04-03"),
      positionTypeId: 1,
      businessId: 3,
    },
  });
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
