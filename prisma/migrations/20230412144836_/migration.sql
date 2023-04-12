/*
  Warnings:

  - You are about to drop the column `profileId` on the `Post` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_profileId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "profileId",
ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "friendId" TEXT;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
