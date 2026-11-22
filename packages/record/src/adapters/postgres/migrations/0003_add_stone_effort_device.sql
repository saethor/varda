ALTER TABLE "record"."stones" ADD COLUMN "effort" integer;--> statement-breakpoint
ALTER TABLE "record"."stones" ADD COLUMN "device" jsonb;--> statement-breakpoint
ALTER TABLE "record"."stones" ADD COLUMN "garmin_reference" jsonb;