/*
  Warnings:

  - You are about to drop the column `cost` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `costUSD` on the `Receipt` table. All the data in the column will be lost.
  - Added the required column `amountInSubUnits` to the `PaymentTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentTransaction" ADD COLUMN     "amountInSubUnits" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "cost",
DROP COLUMN "costUSD";

-- AlterTable
ALTER TABLE "Upload" ALTER COLUMN "uploadEstimate" SET DATA TYPE TEXT,
ALTER COLUMN "uploadEstimateUSD" SET DATA TYPE TEXT;
