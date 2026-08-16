CREATE TABLE "author_questions" (
	"id" serial PRIMARY KEY,
	"essay_slug" text,
	"author_name" text NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"is_public" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "backup_logs" (
	"id" serial PRIMARY KEY,
	"target_repo" text NOT NULL,
	"branch" text DEFAULT 'main' NOT NULL,
	"commit_sha" text,
	"commit_message" text NOT NULL,
	"files_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'success' NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "essays" (
	"id" serial PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '',
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'Philosophy' NOT NULL,
	"tags" text DEFAULT '',
	"reading_time" integer DEFAULT 5 NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"published_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reading_bookmarks" (
	"id" serial PRIMARY KEY,
	"essay_slug" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now()
);
