CREATE SCHEMA "shared";
--> statement-breakpoint
CREATE TABLE "shared"."persons" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"login_account" text NOT NULL,
	CONSTRAINT "persons_login_account_unique" UNIQUE("login_account")
);
