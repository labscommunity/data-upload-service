-- CreateTable
CREATE TABLE "ArweaveKeyPair" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userWalletAddress" TEXT NOT NULL,

    CONSTRAINT "ArweaveKeyPair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArweaveKeyPair_userWalletAddress_key" ON "ArweaveKeyPair"("userWalletAddress");

-- AddForeignKey
ALTER TABLE "ArweaveKeyPair" ADD CONSTRAINT "ArweaveKeyPair_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
