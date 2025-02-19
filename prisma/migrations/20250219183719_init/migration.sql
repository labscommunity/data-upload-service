-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletAddress" TEXT NOT NULL,
    "chainType" TEXT NOT NULL,
    "nonce" TEXT,
    "domain" TEXT,
    "issuedAt" TEXT,
    "lastSignature" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userWalletAddress" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "chainType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fileLocation" TEXT,
    "arweaveTxId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "network" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "cost" DECIMAL NOT NULL,
    "costUSD" DECIMAL NOT NULL,
    CONSTRAINT "Receipt_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receipt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "BalanceTransaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TokenBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "chainType" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "balance" DECIMAL NOT NULL DEFAULT 0.0,
    "userWalletAddress" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TokenBalance_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BalanceTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userWalletAddress" TEXT NOT NULL,
    "chainType" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BalanceTransaction_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_transactionId_key" ON "Receipt"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenBalance_userWalletAddress_chainType_network_key" ON "TokenBalance"("userWalletAddress", "chainType", "network");
