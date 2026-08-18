import "server-only";

import nodemailer from "nodemailer";
import { render } from "react-email";

import { SurveyResultEmail } from "../emails/survey-result-email";
import type { SurveyResult } from "./survey-data";

const DEFAULT_SURVEY_SITE_URL = "https://survey.hbkr.net";
const DEFAULT_SMTP_HOST = "smtp.gmail.com";
const DEFAULT_SMTP_PORT = 465;
const SURVEY_SUPPORT_EMAIL = "support@dreamlabs.co.kr";

export type SendSurveyResultEmailInput = {
  to: string;
  name: string;
  submissionId: string;
  submittedAt: string;
  result: SurveyResult;
};

export function isSurveyResultEmailConfigured() {
  const credentialsPresent = Boolean(
    process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASSWORD?.trim() &&
      process.env.SURVEY_EMAIL_FROM?.trim(),
  );
  if (!credentialsPresent) return false;

  try {
    const port = smtpPort();
    smtpSecure(port);
    return true;
  } catch {
    return false;
  }
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

function smtpPort() {
  const configured = process.env.SMTP_PORT?.trim();
  if (!configured) return DEFAULT_SMTP_PORT;

  const port = Number(configured);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("SMTP_PORT must be an integer between 1 and 65535.");
  }
  return port;
}

function smtpSecure(port: number) {
  const configured = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (!configured) return port === 465;
  if (configured === "true") return true;
  if (configured === "false") return false;
  throw new Error('SMTP_SECURE must be either "true" or "false".');
}

export async function sendSurveyResultEmail({
  to,
  name,
  submissionId,
  submittedAt,
  result,
}: SendSurveyResultEmailInput): Promise<void> {
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const from = process.env.SURVEY_EMAIL_FROM?.trim();
  const missingConfiguration = [
    !user ? "SMTP_USER" : null,
    !password ? "SMTP_PASSWORD" : null,
    !from ? "SURVEY_EMAIL_FROM" : null,
  ].filter((value): value is string => value !== null);

  if (!user || !password || !from) {
    console.warn(
      `[survey-email] skipped submission ${submissionId}: missing ${missingConfiguration.join(", ")}.`,
    );
    return;
  }

  const siteUrl = surveySiteUrl(submissionId);
  let transporter: ReturnType<typeof nodemailer.createTransport> | undefined;

  try {
    const port = smtpPort();
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || DEFAULT_SMTP_HOST,
      port,
      secure: smtpSecure(port),
      auth: { user, pass: password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    const html = await render(
      SurveyResultEmail({
          name,
          submissionId,
          submittedAt,
          result,
          siteUrl,
      }),
    );
    const info = await transporter.sendMail({
      from,
      to,
      subject: "AI Positioning Survey 결과가 도착했습니다",
      html,
      replyTo: SURVEY_SUPPORT_EMAIL,
    });
    console.info(
      `[survey-email] sent submission ${submissionId}; SMTP message ${info.messageId || "unknown"}.`,
    );
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `[survey-email] send failed for submission ${submissionId}: ${errorName}.`,
    );
  } finally {
    transporter?.close();
  }
}
