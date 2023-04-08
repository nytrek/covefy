/*
  Warnings:

  - The primary key for the `Booksmarks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `profileId` on the `Booksmarks` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `bookmark` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `author` to the `Booksmarks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `author` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Booksmarks" DROP CONSTRAINT "Booksmarks_profileId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- AlterTable
ALTER TABLE "Booksmarks" DROP CONSTRAINT "Booksmarks_pkey",
DROP COLUMN "profileId",
ADD COLUMN     "author" TEXT NOT NULL,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Booksmarks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "authorId",
DROP COLUMN "bookmark",
ADD COLUMN     "author" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Profile";

-- DropEnum
DROP TYPE "Role";
