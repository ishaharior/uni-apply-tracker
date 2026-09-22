-- CreateTable
CREATE TABLE "ProfessorBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessorBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessorBookmark_professorId_idx" ON "ProfessorBookmark"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorBookmark_userId_professorId_key" ON "ProfessorBookmark"("userId", "professorId");

-- AddForeignKey
ALTER TABLE "ProfessorBookmark" ADD CONSTRAINT "ProfessorBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorBookmark" ADD CONSTRAINT "ProfessorBookmark_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
