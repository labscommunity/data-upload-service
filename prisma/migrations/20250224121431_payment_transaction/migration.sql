/*
  Warnings:

  - You are about to drop the column `transactionId` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the `BalanceTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TokenBalance` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[paymentTransactionId]` on the table `Upload` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentTransactionId` to the `Upload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userWalletAddress` to the `Upload` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BalanceTransaction" DROP CONSTRAINT "BalanceTransaction_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "BalanceTransaction" DROP CONSTRAINT "BalanceTransaction_userWalletAddress_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "TokenBalance" DROP CONSTRAINT "TokenBalance_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "TokenBalance" DROP CONSTRAINT "TokenBalance_userWalletAddress_fkey";

-- DropIndex
DROP INDEX "Receipt_transactionId_key";

-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "transactionId";

-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "paymentTransactionId" TEXT NOT NULL,
ADD COLUMN     "userWalletAddress" TEXT NOT NULL;

-- DropTable
DROP TABLE "BalanceTransaction";

-- DropTable
DROP TABLE "TokenBalance";

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "userWalletAddress" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionHash_key" ON "PaymentTransaction"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_paymentTransactionId_key" ON "Upload"("paymentTransactionId");

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
