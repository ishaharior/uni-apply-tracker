-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL DEFAULT '',
    "degreeLevel" TEXT NOT NULL DEFAULT '',
    "amount" TEXT NOT NULL DEFAULT '',
    "deadline" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "applicationLink" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scholarship_ownerId_idx" ON "Scholarship"("ownerId");

-- CreateIndex
CREATE INDEX "Scholarship_visibility_idx" ON "Scholarship"("visibility");

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
