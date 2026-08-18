import "server-only";

import { desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { surveySubmissions } from "@/db/schema";
import {
  capabilities,
  depthLabels,
  depthQuestions,
  domains,
  maturityLevels,
  roles,
  type SurveyResult,
} from "@/lib/survey-data";

const PAGE_SIZE = 25;

type SummaryRow = {
  total: number | string;
  uniqueRespondents: number | string;
  today: number | string;
  lastSevenDays: number | string;
};

type QuestionCountRow = {
  questionIndex: number | string;
  answerValue: number | string;
  count: number | string;
};

type ResultCountRow = {
  dimension: string;
  value: string;
  count: number | string;
};

const resultDimensions = [
  {
    key: "primaryDomain",
    label: "주요 도메인",
    options: domains.map(({ value, label }) => ({ value, label })),
  },
  {
    key: "primaryDepth",
    label: "주요 AI Depth",
    options: Object.entries(depthLabels).map(([value, item]) => ({
      value,
      label: item.label,
    })),
  },
  {
    key: "primaryRole",
    label: "주요 역할",
    options: roles.map(({ value, label }) => ({ value, label })),
  },
  {
    key: "maturity",
    label: "운영 성숙도",
    options: maturityLevels.map(({ value, label }) => ({ value, label })),
  },
] as const;

function asNumber(value: number | string | undefined) {
  return Number(value ?? 0);
}

export async function getAdminDashboardData(page: number, query: string) {
  const db = getDb();
  const safePage = Math.max(1, Math.floor(page));
  const trimmedQuery = query.trim().slice(0, 100);
  const search = trimmedQuery
    ? or(
        ilike(surveySubmissions.name, `%${trimmedQuery}%`),
        ilike(surveySubmissions.email, `%${trimmedQuery}%`),
        ilike(surveySubmissions.organization, `%${trimmedQuery}%`),
      )
    : undefined;

  const [summaryResult, questionResult, resultCounts, submissions, filteredCount] =
    await Promise.all([
      db.execute<SummaryRow>(sql`
        select
          count(*)::int as "total",
          count(distinct ${surveySubmissions.email})::int as "uniqueRespondents",
          count(*) filter (
            where ${surveySubmissions.submittedAt} >=
              (date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')
          )::int as "today",
          count(*) filter (
            where ${surveySubmissions.submittedAt} >= now() - interval '7 days'
          )::int as "lastSevenDays"
        from ${surveySubmissions}
      `),
      db.execute<QuestionCountRow>(sql`
        select
          (answer.ordinality - 1)::int as "questionIndex",
          answer.value::int as "answerValue",
          count(*)::int as "count"
        from ${surveySubmissions}
        cross join lateral jsonb_array_elements_text(
          ${surveySubmissions.rawAnswers} -> 'depthAnswers'
        ) with ordinality as answer(value, ordinality)
        group by answer.ordinality, answer.value
        order by answer.ordinality, answer.value
      `),
      db.execute<ResultCountRow>(sql`
        select dimension, value, count(*)::int as "count"
        from (
          select 'primaryDomain' as dimension, ${surveySubmissions.computedResult} ->> 'primaryDomain' as value from ${surveySubmissions}
          union all
          select 'primaryDepth', ${surveySubmissions.computedResult} ->> 'primaryDepth' from ${surveySubmissions}
          union all
          select 'primaryRole', ${surveySubmissions.computedResult} ->> 'primaryRole' from ${surveySubmissions}
          union all
          select 'maturity', ${surveySubmissions.computedResult} ->> 'maturity' from ${surveySubmissions}
        ) result_values
        where value is not null
        group by dimension, value
      `),
      db
        .select({
          id: surveySubmissions.id,
          name: surveySubmissions.name,
          email: surveySubmissions.email,
          organization: surveySubmissions.organization,
          jobTitle: surveySubmissions.jobTitle,
          submittedAt: surveySubmissions.submittedAt,
          computedResult: surveySubmissions.computedResult,
        })
        .from(surveySubmissions)
        .where(search)
        .orderBy(desc(surveySubmissions.submittedAt))
        .limit(PAGE_SIZE)
        .offset((safePage - 1) * PAGE_SIZE),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(surveySubmissions)
        .where(search),
    ]);

  const summary = summaryResult.rows[0];
  const questionLookup = new Map(
    questionResult.rows.map((row) => [
      `${row.questionIndex}:${row.answerValue}`,
      asNumber(row.count),
    ]),
  );
  const questions = depthQuestions.map((question, questionIndex) => {
    const counts = Array.from({ length: 5 }, (_, answerValue) => ({
      value: answerValue,
      count: questionLookup.get(`${questionIndex}:${answerValue}`) ?? 0,
    }));
    return {
      id: question.id,
      text: question.text,
      counts,
      total: counts.reduce((sum, item) => sum + item.count, 0),
    };
  });

  const resultLookup = new Map(
    resultCounts.rows.map((row) => [
      `${row.dimension}:${row.value}`,
      asNumber(row.count),
    ]),
  );
  const charts = resultDimensions.map((dimension) => ({
    key: dimension.key,
    label: dimension.label,
    values: dimension.options
      .map((option) => ({
        ...option,
        count: resultLookup.get(`${dimension.key}:${option.value}`) ?? 0,
      }))
      .filter((item) => item.count > 0)
      .sort((left, right) => right.count - left.count),
  }));

  const filteredTotal = asNumber(filteredCount[0]?.count);
  return {
    summary: {
      total: asNumber(summary?.total),
      uniqueRespondents: asNumber(summary?.uniqueRespondents),
      today: asNumber(summary?.today),
      lastSevenDays: asNumber(summary?.lastSevenDays),
    },
    questions,
    charts,
    submissions,
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      total: filteredTotal,
      totalPages: Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE)),
    },
    query: trimmedQuery,
  };
}

export async function getSubmissionDetail(id: string | undefined) {
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)
  ) {
    return null;
  }
  const db = getDb();
  const [submission] = await db
    .select()
    .from(surveySubmissions)
    .where(eq(surveySubmissions.id, id))
    .limit(1);
  return submission ?? null;
}

export function resultLabel(
  type: "domain" | "depth" | "role" | "maturity" | "capability",
  value: string,
) {
  const sources = {
    domain: domains,
    depth: Object.entries(depthLabels).map(([itemValue, item]) => ({
      value: itemValue,
      label: item.label,
    })),
    role: roles,
    maturity: maturityLevels,
    capability: capabilities,
  };
  return sources[type].find((item) => item.value === value)?.label ?? value;
}

export type AdminSubmissionResult = SurveyResult;
