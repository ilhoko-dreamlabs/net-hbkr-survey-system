"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { after } from "next/server";

import { getDb } from "../../db";
import { surveySubmissions } from "../../db/schema";
import {
  isSurveyResultEmailConfigured,
  sendSurveyResultEmail,
} from "../../lib/email";
import {
  surveySubmissionSchema,
  type SurveySubmissionInput,
} from "../../lib/submission-schema";
import {
  buildSurveyResult,
  type SurveyRawAnswers,
  type SurveyResult,
} from "../../lib/survey-data";

const RATE_LIMIT_MAXIMUM = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;
const DEFAULT_GLOBAL_RATE_LIMIT_MAXIMUM = 500;

function globalRateLimitMaximum(): number {
  const configured = Number.parseInt(
    process.env.SURVEY_GLOBAL_HOURLY_LIMIT ?? "",
    10,
  );

  return Number.isInteger(configured) && configured > 0 && configured <= 10_000
    ? configured
    : DEFAULT_GLOBAL_RATE_LIMIT_MAXIMUM;
}

type SubmitSurveySuccess = {
  ok: true;
  submissionId: string;
  result: SurveyResult;
  submittedAt: string;
  emailDelivery: "scheduled" | "not_configured";
};

type SubmitSurveyFailure = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type SubmitSurveyResult = SubmitSurveySuccess | SubmitSurveyFailure;

function collectFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const field = issue.path.length
      ? issue.path.map(String).join(".")
      : "_form";
    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }

  return fieldErrors;
}

function isDatabaseRateLimitError(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (
      current instanceof Error &&
      current.message.includes("SURVEY_EMAIL_RATE_LIMIT")
    ) {
      return true;
    }

    if (typeof current !== "object" || !("cause" in current)) {
      return false;
    }

    current = (current as { cause?: unknown }).cause;
  }

  return false;
}

export async function submitSurvey(
  input: SurveySubmissionInput,
): Promise<SubmitSurveyResult> {
  const validated = surveySubmissionSchema.safeParse(input);

  if (!validated.success) {
    return {
      ok: false,
      message: "입력 내용을 확인해 주세요.",
      fieldErrors: collectFieldErrors(validated.error.issues),
    };
  }

  const submission = validated.data;

  if (submission.website?.trim()) {
    return {
      ok: false,
      message: "요청을 처리할 수 없습니다.",
    };
  }

  const rawAnswers: SurveyRawAnswers = {
    domains: [...submission.domains],
    primaryDomain: submission.primaryDomain,
    depthAnswers: [...submission.depthAnswers],
    roles: [...submission.roles],
    primaryRole: submission.primaryRole,
    capabilities: [...submission.capabilities],
    maturity: submission.maturity,
  };
  const result = buildSurveyResult(rawAnswers);

  try {
    const database = getDb();
    const rateLimitWindowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const [[recentSubmissions], [recentGlobalSubmissions]] = await Promise.all([
      database
        .select({ total: count() })
        .from(surveySubmissions)
        .where(
          and(
            eq(surveySubmissions.email, submission.respondent.email),
            gte(surveySubmissions.submittedAt, rateLimitWindowStart),
          ),
        ),
      database
        .select({ total: count() })
        .from(surveySubmissions)
        .where(gte(surveySubmissions.submittedAt, rateLimitWindowStart)),
    ]);

    if (
      (recentSubmissions?.total ?? 0) >= RATE_LIMIT_MAXIMUM ||
      (recentGlobalSubmissions?.total ?? 0) >= globalRateLimitMaximum()
    ) {
      return {
        ok: false,
        message: "제출 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    const [stored] = await database
      .insert(surveySubmissions)
      .values({
        name: submission.respondent.name,
        email: submission.respondent.email,
        organization: submission.respondent.organization || null,
        jobTitle: submission.respondent.jobTitle || null,
        surveyVersion: result.version,
        privacyConsent: submission.privacyConsent,
        marketingConsent: submission.marketingConsent,
        privacyVersion: submission.privacyVersion,
        rawAnswers,
        computedResult: result,
      })
      .returning({
        id: surveySubmissions.id,
        submittedAt: surveySubmissions.submittedAt,
      });

    if (!stored) {
      throw new Error("Survey submission insert returned no row.");
    }

    const submittedAt = stored.submittedAt.toISOString();
    let emailDelivery: SubmitSurveySuccess["emailDelivery"] =
      "not_configured";

    if (isSurveyResultEmailConfigured()) {
      try {
        after(async () => {
          try {
            await sendSurveyResultEmail({
              to: submission.respondent.email,
              name: submission.respondent.name,
              submissionId: stored.id,
              submittedAt,
              result,
            });
          } catch (error) {
            const errorName =
              error instanceof Error ? error.name : "UnknownError";
            console.error(
              `[survey-email] unexpected after() failure for submission ${stored.id}: ${errorName}.`,
            );
          }
        });
        emailDelivery = "scheduled";
      } catch (error) {
        const errorName = error instanceof Error ? error.name : "UnknownError";
        console.error(
          `[survey-email] could not schedule submission ${stored.id}: ${errorName}.`,
        );
      }
    } else {
      console.warn(
        `[survey-email] not scheduled for submission ${stored.id}: SMTP credentials and/or SURVEY_EMAIL_FROM is not configured.`,
      );
    }

    return {
      ok: true,
      submissionId: stored.id,
      result,
      submittedAt,
      emailDelivery,
    };
  } catch (error) {
    if (isDatabaseRateLimitError(error)) {
      return {
        ok: false,
        message: "제출 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    console.error("Survey submission could not be stored.");
    return {
      ok: false,
      message: "저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
