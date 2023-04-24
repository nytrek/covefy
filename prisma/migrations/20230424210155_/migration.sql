/*
  Warnings:

  - You are about to drop the column `claim` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "claim",
DROP COLUMN "plan";

-- DropEnum
DROP TYPE "Plan";
