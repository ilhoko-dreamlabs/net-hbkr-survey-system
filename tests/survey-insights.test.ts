import assert from "node:assert/strict";
import test from "node:test";

import { buildSurveyInsight } from "../src/lib/survey-insights";
import type { SurveyResult } from "../src/lib/survey-data";

const baseResult: SurveyResult = {
  version: "1.0",
  primaryDomain: "software",
  domains: ["software"],
  depth: { use: 62, workflow: 88, integrate: 51, build: 30, core: 5 },
  primaryDepth: "workflow",
  roles: ["orchestrator"],
  primaryRole: "orchestrator",
  maturity: "repeatable",
  capabilities: ["workflow", "automation"],
};

test("buildSurveyInsight creates a deterministic, profile-specific interpretation", () => {
  const insight = buildSurveyInsight(baseResult);

  assert.equal(insight.archetype, "프로세스 설계형 AI 워크플로 지휘자");
  assert.equal(insight.strongestDepth, "workflow");
  assert.equal(insight.secondaryDepth, "use");
  assert.match(insight.tagline, /Software \/ Development/);
  assert.match(insight.tagline, /Repeatable/);
  assert.equal(insight.actions.length, 3);
  assert.match(insight.actions[1], /자동화/);
});

test("buildSurveyInsight explains a balanced profile without inventing a weakness", () => {
  const insight = buildSurveyInsight({
    ...baseResult,
    depth: { use: 52, workflow: 51, integrate: 50, build: 49, core: 48 },
    primaryDepth: "use",
  });

  assert.match(insight.signal, /고르게 나타납니다/);
  assert.doesNotMatch(insight.signal, /약점|부족/);
});

test("buildSurveyInsight treats an all-zero response as an exploration starting point", () => {
  const insight = buildSurveyInsight({
    ...baseResult,
    depth: { use: 0, workflow: 0, integrate: 0, build: 0, core: 0 },
    primaryDepth: "use",
    maturity: "explore",
  });

  assert.match(insight.signal, /아직 특정 Depth가 두드러지지 않았습니다/);
  assert.equal(insight.strongestDepth, "use");
  assert.match(insight.actions[0], /실제 업무/);
});
