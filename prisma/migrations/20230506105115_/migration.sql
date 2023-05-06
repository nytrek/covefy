-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "boardId" INTEGER;

-- CreateTable
CREATE TABLE "Board" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "memberId" TEXT NOT NULL,
    "boardId" INTEGER NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("memberId","boardId")
);

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
