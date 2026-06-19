CREATE TYPE "public"."user_persona" AS ENUM('employee', 'employer', 'lawgroup', 'insurer');--> statement-breakpoint
ALTER TABLE "gett_user" ADD COLUMN "persona" "user_persona";--> statement-breakpoint
ALTER TABLE "gett_user" ADD COLUMN "onboardingCompletedAt" timestamp with time zone;