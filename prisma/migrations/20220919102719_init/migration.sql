-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'inprogress', 'success', 'error');

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastCheck" TIMESTAMP NOT NULL,
    "frequency" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "data" JSON NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "due" TIMESTAMP NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'pending',
    "errror" TEXT,
    "accountId" UUID NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AccountToWebhook" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AccountToWebhook_AB_unique" ON "_AccountToWebhook"("A", "B");

-- CreateIndex
CREATE INDEX "_AccountToWebhook_B_index" ON "_AccountToWebhook"("B");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToWebhook" ADD CONSTRAINT "_AccountToWebhook_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToWebhook" ADD CONSTRAINT "_AccountToWebhook_B_fkey" FOREIGN KEY ("B") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
