/*
  Warnings:

  - You are about to drop the `LinkedInMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LinkedInMessage" DROP CONSTRAINT "LinkedInMessage_personId_fkey";

-- AlterTable
ALTER TABLE "LinkedinMessage" ADD COLUMN     "summary" TEXT;

-- DropTable
DROP TABLE "LinkedInMessage";
