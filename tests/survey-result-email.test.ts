import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SurveyResultEmail } from "../src/emails/survey-result-email";
import type { SurveyResult } from "../src/lib/survey-data";

const result: SurveyResult = {
  version: "1.0",
  primaryDomain: "software",
  domains: ["software", "research"],
  depth: {
    use: 72,
    workflow: 81,
    integrate: 64,
    build: 93,
    core: 25,
  },
  primaryDepth: "build",
  roles: ["builder", "researcher"],
  primaryRole: "builder",
  maturity: "production",
  capabilities: ["agent", "mcp"],
};

test("the result email renders the stored profile and stable submission reference", () => {
  const html = renderToStaticMarkup(
    createElement(SurveyResultEmail, {
      name: "홍길동",
      submissionId: "018f-survey-submission",
      submittedAt: "2026-08-14T12:00:00.000Z",
      result,
      siteUrl: "https://survey.hbkr.net///",
    }),
  );

  assert.match(html, /홍길동님의 AI 포지셔닝 결과/u);
  assert.match(html, /Software \/ Development × Build/u);
  assert.match(html, /Builder/u);
  assert.match(html, /Production/u);
  assert.match(html, /Agent · MCP \/ Tool-use/u);
  assert.match(html, /018f-survey-submission/u);
  assert.match(html, /2026년 8월 14일/u);
  assert.match(html, /href="https:\/\/survey\.hbkr\.net"/u);
  assert.match(html, /https:\/\/survey\.hbkr\.net\/privacy/u);
  assert.doesNotMatch(html, /survey\.hbkr\.net\/\/privacy/u);
});

test("the result email escapes respondent text and handles no capabilities", () => {
  const html = renderToStaticMarkup(
    createElement(SurveyResultEmail, {
      name: "<script>alert('mail')</script>",
      submissionId: "safe-id",
      submittedAt: "not-a-date",
      result: { ...result, capabilities: [] },
      siteUrl: "https://survey.hbkr.net",
    }),
  );

  assert.doesNotMatch(html, /<script>/u);
  assert.match(html, /&lt;script&gt;alert\(&#x27;mail&#x27;\)&lt;\/script&gt;/u);
  assert.match(html, /선택 없음/u);
  assert.match(html, /not-a-date \(KST\)/u);
});
