/*
  Warnings:

  - You are about to drop the column `public` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "public",
ADD COLUMN     "label" "Label" NOT NULL DEFAULT 'PUBLIC';
