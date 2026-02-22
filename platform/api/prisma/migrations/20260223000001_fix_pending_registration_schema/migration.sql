-- Add updatedAt column
ALTER TABLE "pending_registrations" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add index on email
CREATE INDEX "pending_registrations_email_idx" ON "pending_registrations"("email");
