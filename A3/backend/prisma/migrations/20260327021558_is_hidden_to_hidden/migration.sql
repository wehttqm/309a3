/*
  Warnings:

  - You are about to drop the column `isHidden` on the `PositionType` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PositionType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_PositionType" ("description", "id", "name") SELECT "description", "id", "name" FROM "PositionType";
DROP TABLE "PositionType";
ALTER TABLE "new_PositionType" RENAME TO "PositionType";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
