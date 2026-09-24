-- CreateTable
CREATE TABLE "MastersCourseBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'interested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MastersCourseBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MastersCourseBookmark_courseId_idx" ON "MastersCourseBookmark"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "MastersCourseBookmark_userId_courseId_key" ON "MastersCourseBookmark"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "MastersCourseBookmark" ADD CONSTRAINT "MastersCourseBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MastersCourseBookmark" ADD CONSTRAINT "MastersCourseBookmark_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "MastersCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
