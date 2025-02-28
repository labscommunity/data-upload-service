/*
  Warnings:

  - You are about to drop the column `arweaveTxId` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `fileLocation` on the `Receipt` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uploadId]` on the table `Receipt` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uploadId` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('SINGLE_FILE', 'MULTIPART_FILE');

-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "arweaveTxId",
DROP COLUMN "fileLocation",
ADD COLUMN     "uploadId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "currentChunk" INTEGER NOT NULL DEFAULT -1,
    "fileLocation" TEXT,
    "arweaveTxId" TEXT,
    "size" INTEGER NOT NULL,
    "uploadEstimate" DECIMAL(65,30) NOT NULL,
    "uploadEstimateUSD" DECIMAL(65,30) NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "uploadType" "UploadType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_uploadId_key" ON "Receipt"("uploadId");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
