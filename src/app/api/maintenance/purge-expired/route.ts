import { timingSafeEqual } from "node:crypto";
import { lt } from "drizzle-orm";

import { getDb } from "@/db";
import { surveySubmissions } from "@/db/schema";

const RETENTION_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1_000;

function secretsMatch(actualHeader: string | null, expectedSecret: string): boolean {
  if (!actualHeader?.startsWith("Bearer ")) return false;

  const actualSecret = actualHeader.slice("Bearer ".length);
  const actual = Buffer.from(actualSecret);
  const expected = Buffer.from(expectedSecret);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("Retention job is disabled because CRON_SECRET is not configured.");
    return Response.json({ ok: false }, { status: 503 });
  }

  if (!secretsMatch(request.headers.get("authorization"), cronSecret)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS);

  try {
    const deleted = await getDb()
      .delete(surveySubmissions)
      .where(lt(surveySubmissions.submittedAt, cutoff))
      .returning({ id: surveySubmissions.id });

    console.info(`Survey retention job deleted ${deleted.length} expired submissions.`);
    return Response.json({ ok: true, deleted: deleted.length, cutoff: cutoff.toISOString() });
  } catch {
    console.error("Survey retention job failed.");
    return Response.json({ ok: false }, { status: 500 });
  }
}
