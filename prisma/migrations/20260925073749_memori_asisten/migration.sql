-- CreateTable
CREATE TABLE "MemoriAsisten" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoriAsisten_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoriAsisten_userId_updatedAt_idx" ON "MemoriAsisten"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "MemoriAsisten" ADD CONSTRAINT "MemoriAsisten_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
