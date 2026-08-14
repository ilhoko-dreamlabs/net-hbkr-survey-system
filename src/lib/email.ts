import "server-only";

import { Resend } from "resend";

import { SurveyResultEmail } from "../emails/survey-result-email";
import type { SurveyResult } from "./survey-data";

const DEFAULT_SURVEY_SITE_URL = "https://survey.hbkr.net";
const EMAIL_TEMPLATE_VERSION = "v1";

export type SendSurveyResultEmailInput = {
  to: string;
  name: string;
  submissionId: string;
  submittedAt: string;
  result: SurveyResult;
};

export function isSurveyResultEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.SURVEY_EMAIL_FROM?.trim(),
  );
}

function surveySiteUrl(submissionId: string) {
  const configured = process.env.SURVEY_SITE_URL?.trim();

  if (!configured) {
    console.warn(
      `[survey-email] SURVEY_SITE_URL is not configured for submission ${submissionId}; using ${DEFAULT_SURVEY_SITE_URL}.`,
    );
    return DEFAULT_SURVEY_SITE_URL;
  }

  try {
    const url = new URL(configured);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error("SURVEY_SITE_URL must be a plain HTTPS origin.");
    }

    return url.origin;
  } catch {
    console.warn(
      `[survey-email] SURVEY_SITE_URL is invalid for submission ${submissionId}; using ${DEFAULT_SURVEY_SITE_URL}.`,
    );
    return DEFAULT_SURVEY_SITE_URL;
  }
}

export function surveyResultEmailIdempotencyKey(submissionId: string) {
  return `survey-result/${submissionId}/${EMAIL_TEMPLATE_VERSION}`;
}

export async function sendSurveyResultEmail({
  to,
  name,
  submissionId,
  submittedAt,
  result,
}: SendSurveyResultEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.SURVEY_EMAIL_FROM?.trim();
  const missingConfiguration = [
    !apiKey ? "RESEND_API_KEY" : null,
    !from ? "SURVEY_EMAIL_FROM" : null,
  ].filter((value): value is string => value !== null);

  if (!apiKey || !from) {
    console.warn(
      `[survey-email] skipped submission ${submissionId}: missing ${missingConfiguration.join(", ")}.`,
    );
    return;
  }

  const replyTo = process.env.SURVEY_EMAIL_REPLY_TO?.trim();
  const siteUrl = surveySiteUrl(submissionId);

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      {
        from,
        to: [to],
        subject: "AI Positioning Survey 결과가 도착했습니다",
        react: SurveyResultEmail({
          name,
          submissionId,
          submittedAt,
          result,
          siteUrl,
        }),
        ...(replyTo ? { replyTo } : {}),
      },
      {
        idempotencyKey: surveyResultEmailIdempotencyKey(submissionId),
      },
    );

    if (error) {
      console.error(
        `[survey-email] provider rejected submission ${submissionId}: ${error.name ?? "unknown_error"}.`,
      );
      return;
    }

    console.info(
      `[survey-email] sent submission ${submissionId}; provider message ${data?.id ?? "unknown"}.`,
    );
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `[survey-email] send failed for submission ${submissionId}: ${errorName}.`,
    );
  }
}
