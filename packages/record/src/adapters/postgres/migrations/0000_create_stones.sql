CREATE SCHEMA "record";
--> statement-breakpoint
CREATE TABLE "record"."stones" (
	"id" uuid PRIMARY KEY NOT NULL,
	"athlete" uuid NOT NULL,
	"session_key" text NOT NULL,
	"file_name" text NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"local_date" date NOT NULL,
	"sport" text NOT NULL,
	"distance" double precision,
	"moving_time" double precision NOT NULL,
	"elapsed_time" double precision NOT NULL,
	"laps" jsonb NOT NULL,
	CONSTRAINT "stones_athlete_session_key_unique" UNIQUE("athlete","session_key")
);
--> statement-breakpoint
CREATE INDEX "stones_athlete_local_date_index" ON "record"."stones" USING btree ("athlete","local_date");