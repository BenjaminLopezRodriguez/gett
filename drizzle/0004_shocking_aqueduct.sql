CREATE TYPE "public"."case_contact_role" AS ENUM('client', 'lawyer', 'adjuster');--> statement-breakpoint
CREATE TYPE "public"."handoff_channel" AS ENUM('sms', 'web', 'voice');--> statement-breakpoint
CREATE TYPE "public"."handoff_intent" AS ENUM('upload', 'intake', 'general');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('sms', 'call');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TABLE "gett_case_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caseId" uuid NOT NULL,
	"role" "case_contact_role" NOT NULL,
	"phoneE164" varchar(20) NOT NULL,
	"displayName" varchar(256) NOT NULL,
	"smsConsentAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gett_case_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caseId" uuid NOT NULL,
	"direction" "message_direction" NOT NULL,
	"templateId" varchar(128) NOT NULL,
	"channel" "message_channel" NOT NULL,
	"actorId" uuid,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gett_intake_handoff_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"channel" "handoff_channel" NOT NULL,
	"phoneE164" varchar(20),
	"intent" "handoff_intent" DEFAULT 'upload' NOT NULL,
	"intentMeta" jsonb DEFAULT '{}'::jsonb,
	"caseId" uuid,
	"userId" uuid,
	"expiresAt" timestamp with time zone NOT NULL,
	"consumedAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gett_case_contact" ADD CONSTRAINT "gett_case_contact_caseId_gett_case_id_fk" FOREIGN KEY ("caseId") REFERENCES "public"."gett_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_case_message" ADD CONSTRAINT "gett_case_message_caseId_gett_case_id_fk" FOREIGN KEY ("caseId") REFERENCES "public"."gett_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_case_message" ADD CONSTRAINT "gett_case_message_actorId_gett_user_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."gett_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_intake_handoff_token" ADD CONSTRAINT "gett_intake_handoff_token_caseId_gett_case_id_fk" FOREIGN KEY ("caseId") REFERENCES "public"."gett_case"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_intake_handoff_token" ADD CONSTRAINT "gett_intake_handoff_token_userId_gett_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."gett_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "case_contact_unique_idx" ON "gett_case_contact" USING btree ("caseId","phoneE164","role");--> statement-breakpoint
CREATE INDEX "case_contact_case_idx" ON "gett_case_contact" USING btree ("caseId");--> statement-breakpoint
CREATE INDEX "case_message_case_idx" ON "gett_case_message" USING btree ("caseId");--> statement-breakpoint
CREATE UNIQUE INDEX "handoff_token_hash_idx" ON "gett_intake_handoff_token" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "handoff_token_expires_idx" ON "gett_intake_handoff_token" USING btree ("expiresAt");