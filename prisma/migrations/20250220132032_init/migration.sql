-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "Token" AS ENUM ('USDC', 'USDT', 'ETH', 'SOL', 'AR');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING', 'PAID', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ChainType" AS ENUM ('evm', 'solana', 'arweave');

-- CreateEnum
CREATE TYPE "Network" AS ENUM ('mainnet', 'testnet');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "chainType" "ChainType" NOT NULL,
    "nonce" TEXT,
    "domain" TEXT,
    "issuedAt" TIMESTAMP(3),
    "lastSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "userWalletAddress" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "chainType" "ChainType" NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "fileLocation" TEXT,
    "arweaveTxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "network" "Network" NOT NULL,
    "token" "Token" NOT NULL,
    "cost" DECIMAL(65,30) NOT NULL,
    "costUSD" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenBalance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "chainType" "ChainType" NOT NULL,
    "network" "Network" NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "userWalletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceTransaction" (
    "id" TEXT NOT NULL,
    "userWalletAddress" TEXT NOT NULL,
    "chainType" "ChainType" NOT NULL,
    "network" "Network" NOT NULL,
    "token" "Token" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BalanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_transactionId_key" ON "Receipt"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenBalance_userWalletAddress_chainType_network_key" ON "TokenBalance"("userWalletAddress", "chainType", "network");

-- CreateIndex
CREATE UNIQUE INDEX "BalanceTransaction_transactionHash_key" ON "BalanceTransaction"("transactionHash");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "BalanceTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenBalance" ADD CONSTRAINT "TokenBalance_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
