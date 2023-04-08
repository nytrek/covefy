/*
  Warnings:

  - Added the required column `authorProfileImageUrl` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "authorProfileImageUrl" TEXT NOT NULL;
