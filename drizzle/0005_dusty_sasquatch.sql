CREATE TABLE "gett_waitlist_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"segment" varchar(64) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_email_segment_idx" ON "gett_waitlist_entry" USING btree ("email","segment");