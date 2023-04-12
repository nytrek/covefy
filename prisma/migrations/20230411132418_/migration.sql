/*
  Warnings:

  - Made the column `status` on table `Friend` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'PENDING'; COMMIT;

-- AlterTable
ALTER TABLE "Friend" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
