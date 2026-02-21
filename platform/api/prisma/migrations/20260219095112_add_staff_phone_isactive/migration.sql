-- AlterTable
ALTER TABLE "staff" ADD COLUMN "phone" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
