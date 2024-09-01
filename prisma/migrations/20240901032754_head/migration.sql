-- CreateTable
CREATE TABLE "Head" (
    "chain" TEXT NOT NULL,
    "txVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Head_pkey" PRIMARY KEY ("chain")
);
