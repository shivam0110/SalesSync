-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "personRole" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chat_linkedinUrl_idx" ON "Chat"("linkedinUrl");
