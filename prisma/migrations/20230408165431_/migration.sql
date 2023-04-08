/*
  Warnings:

  - You are about to drop the column `public` on the `Post` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Label" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "public",
ADD COLUMN     "label" "Label" NOT NULL DEFAULT 'PUBLIC';
