-- CreateTable
CREATE TABLE "MastersCourse" (
    "id" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "ieltsReq" TEXT NOT NULL DEFAULT '',
    "lastDate" TEXT NOT NULL DEFAULT '',
    "applicationLink" TEXT NOT NULL DEFAULT '',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MastersCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MastersCourse_ownerId_idx" ON "MastersCourse"("ownerId");

-- CreateIndex
CREATE INDEX "MastersCourse_visibility_idx" ON "MastersCourse"("visibility");

-- AddForeignKey
ALTER TABLE "MastersCourse" ADD CONSTRAINT "MastersCourse_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
