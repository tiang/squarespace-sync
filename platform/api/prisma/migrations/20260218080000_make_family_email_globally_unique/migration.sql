-- DropIndex: remove campus-scoped composite unique
DROP INDEX "families_campusId_primaryEmail_key";

-- CreateIndex: global unique on primaryEmail
CREATE UNIQUE INDEX "families_primaryEmail_key" ON "families"("primaryEmail");
