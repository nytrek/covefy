/*
  Warnings:

  - You are about to drop the column `author` on the `Post` table. All the data in the column will be lost.
  - Added the required column `authorName` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorUsername` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "author",
ADD COLUMN     "authorName" TEXT NOT NULL,
ADD COLUMN     "authorUsername" TEXT NOT NULL;
