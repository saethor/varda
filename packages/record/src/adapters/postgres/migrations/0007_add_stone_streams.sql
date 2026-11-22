CREATE TABLE "record"."stone_streams" (
	"stone_id" uuid PRIMARY KEY NOT NULL,
	"streams" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "record"."stone_streams" ADD CONSTRAINT "stone_streams_stone_id_stones_id_fk" FOREIGN KEY ("stone_id") REFERENCES "record"."stones"("id") ON DELETE cascade ON UPDATE no action;