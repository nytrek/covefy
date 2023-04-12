-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Friend" (
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "Status",

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("receiverId","senderId")
);

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
