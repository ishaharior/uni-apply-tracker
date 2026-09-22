-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'public';

-- CreateIndex
CREATE INDEX "Professor_ownerId_idx" ON "Professor"("ownerId");

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
