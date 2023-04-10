/*
  Warnings:

  - The primary key for the `Bookmark` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `authorId` on the `Bookmark` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Bookmark` table. All the data in the column will be lost.
  - The primary key for the `Like` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `authorId` on the `Like` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Like` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `authorName` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `authorProfileImageUrl` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `authorUsername` on the `Post` table. All the data in the column will be lost.
  - Added the required column `profileId` to the `Bookmark` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Like` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_pkey",
DROP COLUMN "authorId",
DROP COLUMN "id",
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("postId", "profileId");

-- AlterTable
ALTER TABLE "Like" DROP CONSTRAINT "Like_pkey",
DROP COLUMN "authorId",
DROP COLUMN "id",
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD CONSTRAINT "Like_pkey" PRIMARY KEY ("postId", "profileId");

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "authorId",
DROP COLUMN "authorName",
DROP COLUMN "authorProfileImageUrl",
DROP COLUMN "authorUsername",
ADD COLUMN     "profileId" TEXT;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
