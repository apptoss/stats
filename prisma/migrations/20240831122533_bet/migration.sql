-- CreateTable
CREATE TABLE "Bet" (
    "chain" TEXT NOT NULL,
    "txVersion" INTEGER NOT NULL,
    "eventIndex" INTEGER NOT NULL,
    "player" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "usdValue" DECIMAL(65,30) NOT NULL,
    "payRatio" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Bet_chain_txVersion_eventIndex_key" ON "Bet"("chain", "txVersion", "eventIndex");
