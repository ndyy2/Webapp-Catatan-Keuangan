-- AlterTable
ALTER TABLE "user" ADD COLUMN     "groqKey" TEXT;

-- CreateTable
CREATE TABLE "PesanAsisten" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "peran" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PesanAsisten_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PesanAsisten_userId_createdAt_idx" ON "PesanAsisten"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PesanAsisten" ADD CONSTRAINT "PesanAsisten_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
