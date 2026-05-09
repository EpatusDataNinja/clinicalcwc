-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedCaseBlob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedCaseBlob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedTaskBlob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "caseId" TEXT,
    "encryptedData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedTaskBlob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SyncedCaseBlob_userId_idx" ON "SyncedCaseBlob"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedCaseBlob_userId_entityId_key" ON "SyncedCaseBlob"("userId", "entityId");

-- CreateIndex
CREATE INDEX "SyncedTaskBlob_userId_idx" ON "SyncedTaskBlob"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedTaskBlob_userId_entityId_key" ON "SyncedTaskBlob"("userId", "entityId");

-- AddForeignKey
ALTER TABLE "SyncedCaseBlob" ADD CONSTRAINT "SyncedCaseBlob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedTaskBlob" ADD CONSTRAINT "SyncedTaskBlob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
