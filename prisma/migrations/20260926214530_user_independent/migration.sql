-- AlterTable
ALTER TABLE "User" ADD COLUMN     "independent" BOOLEAN NOT NULL DEFAULT false;

-- Data: Mahmud is an independent user (sees only his own records)
UPDATE "User" SET "independent" = true WHERE "username" = 'mahmud';
