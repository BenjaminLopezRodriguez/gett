CREATE TYPE "public"."case_member_role" AS ENUM('owner', 'member', 'lawyer', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('open', 'in_review', 'pending_lawyer', 'closed');--> statement-breakpoint
CREATE TABLE "gett_case_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caseId" uuid NOT NULL,
	"actorId" uuid,
	"action" varchar(128) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gett_case_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caseId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" "case_member_role" NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gett_case" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caseHash" varchar(64) NOT NULL,
	"title" varchar(512) NOT NULL,
	"status" "case_status" DEFAULT 'open' NOT NULL,
	"createdBy" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gett_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caseId" uuid NOT NULL,
	"filename" varchar(512) NOT NULL,
	"pdfAiDocId" varchar(256),
	"sha256" varchar(64) NOT NULL,
	"extractedText" text,
	"uploadedBy" uuid NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gett_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kindeId" varchar(256) NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(256),
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gett_case_event" ADD CONSTRAINT "gett_case_event_caseId_gett_case_id_fk" FOREIGN KEY ("caseId") REFERENCES "public"."gett_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_case_event" ADD CONSTRAINT "gett_case_event_actorId_gett_user_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."gett_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_case_member" ADD CONSTRAINT "gett_case_member_caseId_gett_case_id_fk" FOREIGN KEY ("caseId") REFERENCES "public"."gett_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_case_member" ADD CONSTRAINT "gett_case_member_userId_gett_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."gett_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_case" ADD CONSTRAINT "gett_case_createdBy_gett_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."gett_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_document" ADD CONSTRAINT "gett_document_caseId_gett_case_id_fk" FOREIGN KEY ("caseId") REFERENCES "public"."gett_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gett_document" ADD CONSTRAINT "gett_document_uploadedBy_gett_user_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."gett_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_event_case_created_idx" ON "gett_case_event" USING btree ("caseId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "case_member_unique_idx" ON "gett_case_member" USING btree ("caseId","userId");--> statement-breakpoint
CREATE INDEX "case_member_user_idx" ON "gett_case_member" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "case_hash_idx" ON "gett_case" USING btree ("caseHash");--> statement-breakpoint
CREATE INDEX "case_created_by_idx" ON "gett_case" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "document_case_idx" ON "gett_document" USING btree ("caseId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_kinde_id_idx" ON "gett_user" USING btree ("kindeId");