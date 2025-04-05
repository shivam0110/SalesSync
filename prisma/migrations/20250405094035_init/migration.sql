-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "selling" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_linkedinUrl_key" ON "Person"("linkedinUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Company_linkedinUrl_key" ON "Company"("linkedinUrl");
