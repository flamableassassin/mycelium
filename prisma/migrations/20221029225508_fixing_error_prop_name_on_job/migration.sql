/*
  Warnings:

  - You are about to drop the column `errror` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "errror",
ADD COLUMN     "error" TEXT;
