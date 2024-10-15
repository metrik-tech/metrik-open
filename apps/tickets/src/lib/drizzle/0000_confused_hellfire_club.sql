-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "public"."Category" AS ENUM('GENERAL', 'BILLING', 'SDK', 'OTHER', 'ACCOUNT', 'SECURITY');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."Level" AS ENUM('STALE', 'NEW', 'LOW', 'MEDIUM', 'HIGH');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."Team" AS ENUM('ENGINEERING', 'BILLING', 'SUPPORT', 'MODERATION', 'TRIAGE', 'EXECUTIVE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kv" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Ticket" (
	"id" serial PRIMARY KEY NOT NULL,
	"channelId" text NOT NULL,
	"userId" text NOT NULL,
	"assignedTo" text,
	"team" "Team" DEFAULT 'TRIAGE' NOT NULL,
	"level" "Level" DEFAULT 'NEW' NOT NULL,
	"category" "Category" DEFAULT 'OTHER' NOT NULL,
	"reason" text NOT NULL,
	"closedAt" timestamp(3),
	"closedBy" text,
	"closed" boolean DEFAULT false,
	"solved" boolean,
	"closingNotes" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Message" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"content" text NOT NULL,
	"attachments" text[],
	"createdAt" timestamp(3) NOT NULL,
	"replyingTo" text,
	"ticketId" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message" ADD CONSTRAINT "Message_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/