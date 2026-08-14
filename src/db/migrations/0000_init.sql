CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE "survey_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"email" varchar(254) NOT NULL,
	"organization" varchar(120),
	"job_title" varchar(120),
	"survey_version" varchar(16) NOT NULL,
	"privacy_consent" boolean NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"marketing_verified_at" timestamp with time zone,
	"privacy_version" varchar(32) NOT NULL,
	"raw_answers" jsonb NOT NULL,
	"computed_result" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "survey_submissions_name_not_blank" CHECK (char_length(btrim("survey_submissions"."name")) BETWEEN 1 AND 80),
	CONSTRAINT "survey_submissions_email_normalized" CHECK ("survey_submissions"."email" = lower(btrim("survey_submissions"."email"))),
	CONSTRAINT "survey_submissions_privacy_consent_required" CHECK ("survey_submissions"."privacy_consent" IS TRUE),
	CONSTRAINT "survey_submissions_raw_answers_object" CHECK (jsonb_typeof("survey_submissions"."raw_answers") = 'object'),
	CONSTRAINT "survey_submissions_computed_result_object" CHECK (jsonb_typeof("survey_submissions"."computed_result") = 'object')
);
--> statement-breakpoint
CREATE INDEX "survey_submissions_email_submitted_at_idx" ON "survey_submissions" USING btree ("email","submitted_at");--> statement-breakpoint
CREATE INDEX "survey_submissions_submitted_at_idx" ON "survey_submissions" USING btree ("submitted_at");
--> statement-breakpoint
-- Serialize submissions for one normalized email so concurrent requests cannot
-- bypass the application-level five-per-hour check.
CREATE OR REPLACE FUNCTION "enforce_survey_submission_email_rate_limit"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW."email", 0));

  IF (
    SELECT count(*)
    FROM "survey_submissions"
    WHERE "email" = NEW."email"
      AND "submitted_at" >= NEW."submitted_at" - interval '1 hour'
      AND "submitted_at" <= NEW."submitted_at"
  ) >= 5 THEN
    RAISE EXCEPTION 'SURVEY_EMAIL_RATE_LIMIT' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "survey_submissions_email_rate_limit"
BEFORE INSERT ON "survey_submissions"
FOR EACH ROW
EXECUTE FUNCTION "enforce_survey_submission_email_rate_limit"();
