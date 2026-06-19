ALTER TABLE "gett_case" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "gett_document" ADD COLUMN "storageKey" varchar(1024) NOT NULL;--> statement-breakpoint
ALTER TABLE "gett_document" ADD COLUMN "storageBucket" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."gett_case" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."case_status";--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('draft', 'intake', 'in_review', 'with_lawyer', 'closed');--> statement-breakpoint
ALTER TABLE "public"."gett_case" ALTER COLUMN "status" SET DATA TYPE "public"."case_status" USING (
  CASE "status"
    WHEN 'open' THEN 'draft'::"public"."case_status"
    WHEN 'pending_lawyer' THEN 'with_lawyer'::"public"."case_status"
    WHEN 'in_review' THEN 'in_review'::"public"."case_status"
    WHEN 'closed' THEN 'closed'::"public"."case_status"
    WHEN 'draft' THEN 'draft'::"public"."case_status"
    WHEN 'intake' THEN 'intake'::"public"."case_status"
    WHEN 'with_lawyer' THEN 'with_lawyer'::"public"."case_status"
    ELSE 'draft'::"public"."case_status"
  END
);--> statement-breakpoint
ALTER TABLE "gett_case" ALTER COLUMN "status" SET DEFAULT 'draft';
