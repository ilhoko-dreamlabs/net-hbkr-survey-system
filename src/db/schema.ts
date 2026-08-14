import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { SurveyRawAnswers, SurveyResult } from "../lib/survey-data";

export const surveySubmissions = pgTable(
  "survey_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    organization: varchar("organization", { length: 120 }),
    jobTitle: varchar("job_title", { length: 120 }),
    surveyVersion: varchar("survey_version", { length: 16 }).notNull(),
    privacyConsent: boolean("privacy_consent").notNull(),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    marketingVerifiedAt: timestamp("marketing_verified_at", {
      withTimezone: true,
      mode: "date",
    }),
    privacyVersion: varchar("privacy_version", { length: 32 }).notNull(),
    rawAnswers: jsonb("raw_answers").$type<SurveyRawAnswers>().notNull(),
    computedResult: jsonb("computed_result").$type<SurveyResult>().notNull(),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("survey_submissions_email_submitted_at_idx").on(
      table.email,
      table.submittedAt,
    ),
    index("survey_submissions_submitted_at_idx").on(table.submittedAt),
    check(
      "survey_submissions_name_not_blank",
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 80`,
    ),
    check(
      "survey_submissions_email_normalized",
      sql`${table.email} = lower(btrim(${table.email}))`,
    ),
    check(
      "survey_submissions_privacy_consent_required",
      sql`${table.privacyConsent} IS TRUE`,
    ),
    check(
      "survey_submissions_raw_answers_object",
      sql`jsonb_typeof(${table.rawAnswers}) = 'object'`,
    ),
    check(
      "survey_submissions_computed_result_object",
      sql`jsonb_typeof(${table.computedResult}) = 'object'`,
    ),
  ],
);

export type SurveySubmission = typeof surveySubmissions.$inferSelect;
export type NewSurveySubmission = typeof surveySubmissions.$inferInsert;
