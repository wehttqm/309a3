/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example:
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
"use strict";

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    console.error("Usage: node prisma/createsu.js username email password");
    process.exit(1);
  }

  const [username, email, password] = args;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // expires in 7 days

  try {
    const user = await prisma.user.create({
      data: {
        first_name: username,
        last_name: "",
        password: password,
        email: email,
        role: "admin",
        expiresAt,
        activated: true,
      },
    });

    console.log("Superuser created successfully:");
    console.log(user);
  } catch (err) {
    console.error("Error creating superuser:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
