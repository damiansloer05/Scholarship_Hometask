-- Add createdAt to checklist_items (was missing, makes it impossible to know when a checklist was first created)
ALTER TABLE "checklist_items" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint

-- Prevent duplicate checklist rows when concurrent requests race through getOrCreateChecklist.
-- The service uses ON CONFLICT DO NOTHING + re-fetch to safely handle this case.
CREATE UNIQUE INDEX IF NOT EXISTS "checklist_items_profile_req_unique" ON "checklist_items" ("profile_id", "requirement_id");
--> statement-breakpoint

-- Upgrade application_deadline from varchar(10) to proper DATE.
-- Enables DB-level date validation, correct ORDER BY, and range queries.
ALTER TABLE "programs" ALTER COLUMN "application_deadline" TYPE date USING "application_deadline"::date;
--> statement-breakpoint

-- Upgrade due_date from varchar(10) to proper DATE for the same reasons.
ALTER TABLE "checklist_items" ALTER COLUMN "due_date" TYPE date USING "due_date"::date;
