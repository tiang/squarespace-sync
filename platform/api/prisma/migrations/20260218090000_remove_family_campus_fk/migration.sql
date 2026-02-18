-- DropForeignKey: families.campusId → campuses
ALTER TABLE "families" DROP CONSTRAINT "families_campusId_fkey";

-- AlterTable: remove campusId column
ALTER TABLE "families" DROP COLUMN "campusId";
