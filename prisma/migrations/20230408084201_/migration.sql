/*
  Warnings:

  - You are about to drop the `Booksmarks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booksmarks" DROP CONSTRAINT "Booksmarks_postId_fkey";

-- DropTable
DROP TABLE "Booksmarks";

-- CreateTable
CREATE TABLE "Bookmarks" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "author" TEXT NOT NULL,

    CONSTRAINT "Bookmarks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bookmarks" ADD CONSTRAINT "Bookmarks_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
