/*
  Warnings:

  - A unique constraint covering the columns `[chatId]` on the table `LinkedinMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LinkedinMessage_chatId_key" ON "LinkedinMessage"("chatId");
