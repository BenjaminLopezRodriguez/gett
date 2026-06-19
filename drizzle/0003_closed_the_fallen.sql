CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'pending', 'verified', 'skipped');--> statement-breakpoint
ALTER TABLE "gett_user" ADD COLUMN "verificationStatus" "verification_status" DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE "gett_user" ADD COLUMN "verificationPayload" jsonb;