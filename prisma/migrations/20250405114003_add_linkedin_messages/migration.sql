-- CreateTable
CREATE TABLE "LinkedinMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "lastMessage" TEXT NOT NULL,
    "lastMessageDate" TIMESTAMP(3) NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedinMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkedinMessage_linkedinUrl_idx" ON "LinkedinMessage"("linkedinUrl");

-- CreateIndex
CREATE INDEX "LinkedinMessage_chatId_idx" ON "LinkedinMessage"("chatId");
