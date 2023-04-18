-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "profileId" TEXT NOT NULL,
    "bannerId" INTEGER NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("profileId","bannerId")
);

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
