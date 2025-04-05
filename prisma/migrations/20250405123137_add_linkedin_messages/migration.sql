-- CreateTable
CREATE TABLE "LinkedInMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender_name" TEXT NOT NULL,
    "sender_url" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "LinkedInMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkedInMessage_chatId_idx" ON "LinkedInMessage"("chatId");

-- CreateIndex
CREATE INDEX "LinkedInMessage_personId_idx" ON "LinkedInMessage"("personId");

-- AddForeignKey
ALTER TABLE "LinkedInMessage" ADD CONSTRAINT "LinkedInMessage_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
