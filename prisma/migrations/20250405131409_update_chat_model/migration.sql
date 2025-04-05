/*
  Warnings:

  - You are about to drop the column `company` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `personName` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `personRole` on the `Chat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "company",
DROP COLUMN "personName",
DROP COLUMN "personRole",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
