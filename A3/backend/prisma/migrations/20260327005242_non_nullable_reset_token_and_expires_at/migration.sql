/*
  Warnings:

  - Made the column `expiresAt` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `resetToken` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "resetToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'regular',
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone_number" TEXT,
    "postal_address" TEXT,
    "birthday" TEXT,
    "avatar" TEXT,
    "resume" TEXT,
    "biography" TEXT,
    "business_name" TEXT,
    "owner_name" TEXT,
    "locationLat" REAL,
    "locationLon" REAL
);
INSERT INTO "new_User" ("activated", "avatar", "biography", "birthday", "business_name", "createdAt", "email", "expiresAt", "first_name", "id", "isAvailable", "lastActive", "last_name", "locationLat", "locationLon", "owner_name", "password", "phone_number", "postal_address", "resetToken", "resume", "role", "suspended", "verified") SELECT "activated", "avatar", "biography", "birthday", "business_name", "createdAt", "email", "expiresAt", "first_name", "id", "isAvailable", "lastActive", "last_name", "locationLat", "locationLon", "owner_name", "password", "phone_number", "postal_address", "resetToken", "resume", "role", "suspended", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
