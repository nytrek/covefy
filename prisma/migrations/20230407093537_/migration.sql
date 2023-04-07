/*
  Warnings:

  - You are about to drop the column `Like` on the `Post` table. All the data in the column will be lost.
  - Added the required column `name` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "Like",
ADD COLUMN     "like" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "name" TEXT NOT NULL;
