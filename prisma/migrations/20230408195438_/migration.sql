/*
  Warnings:

  - You are about to drop the column `author` on the `Bookmark` table. All the data in the column will be lost.
  - You are about to drop the column `author` on the `Like` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Bookmark` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `Like` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "author",
ADD COLUMN     "authorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "author",
ADD COLUMN     "authorId" TEXT NOT NULL;
