/*
  Warnings:

  - You are about to drop the column `stat` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "stat",
ADD COLUMN     "stats" INTEGER NOT NULL DEFAULT 0;
