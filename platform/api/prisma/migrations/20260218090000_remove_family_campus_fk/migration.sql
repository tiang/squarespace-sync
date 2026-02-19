-- DropForeignKey: families.campusId → campuses
ALTER TABLE "families" DROP CONSTRAINT "families_campusId_fkey";

-- AlterTable: remove campusId column
-- DESTRUCTIVE: existing campusId values are permanently discarded.
-- Campus affiliation is now derived via family → students → enrolments → cohort → campus.
-- Ensure a database backup exists before applying to production.
ALTER TABLE "families" DROP COLUMN "campusId";
