CREATE TABLE IF NOT EXISTS "trx_employee" (
	"id" serial PRIMARY KEY NOT NULL,
	"firstname" varchar(10) NOT NULL,
	"lastname" varchar(10) NOT NULL,
	"gender" char(6) NOT NULL,
	"country" varchar(20) NOT NULL,
	"age" integer NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "upload_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer,
	"row_number" integer NOT NULL,
	"error_type" varchar(50) NOT NULL,
	"error_message" text NOT NULL,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "upload_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"status" varchar(20) NOT NULL,
	"total_records" integer,
	"processed_records" integer DEFAULT 0,
	"failed_records" integer DEFAULT 0,
	"error_details" jsonb,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upload_errors" ADD CONSTRAINT "upload_errors_job_id_upload_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."upload_jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trx_employee_id" ON "trx_employee" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trx_employee_firstname" ON "trx_employee" USING btree ("firstname");