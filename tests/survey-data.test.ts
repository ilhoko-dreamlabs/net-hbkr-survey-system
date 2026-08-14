import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSurveyResult,
  calculateDepth,
  depthQuestions,
} from "../src/lib/survey-data";

test("calculateDepth normalizes the minimum and maximum answer sets", () => {
  assert.deepEqual(calculateDepth(Array(depthQuestions.length).fill(0)), {
    use: 0,
    workflow: 0,
    integrate: 0,
    build: 0,
    core: 0,
  });

  assert.deepEqual(calculateDepth(Array(depthQuestions.length).fill(4)), {
    use: 100,
    workflow: 100,
    integrate: 100,
    build: 100,
    core: 100,
  });
});

test("calculateDepth applies cross-axis weights before rounding", () => {
  const answers = [4, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  assert.deepEqual(calculateDepth(answers), {
    use: 80,
    workflow: 7,
    integrate: 0,
    build: 0,
    core: 0,
  });
});

test("calculateDepth rejects incomplete, fractional, and out-of-range answers", () => {
  const invalidAnswerSets = [
    Array(depthQuestions.length - 1).fill(0),
    [0.5, ...Array(depthQuestions.length - 1).fill(0)],
    [5, ...Array(depthQuestions.length - 1).fill(0)],
    [-1, ...Array(depthQuestions.length - 1).fill(0)],
  ];

  for (const answers of invalidAnswerSets) {
    assert.throws(
      () => calculateDepth(answers),
      (error: unknown) =>
        error instanceof RangeError &&
        error.message.includes(
          `exactly ${depthQuestions.length} integers between 0 and 4`,
        ),
    );
  }
});

test("buildSurveyResult selects the strongest depth and copies answer arrays", () => {
  const input = {
    domains: ["software", "research"],
    primaryDomain: "research",
    depthAnswers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
    roles: ["builder", "researcher"],
    primaryRole: "builder",
    capabilities: ["agent", "serving"],
    maturity: "production",
  } satisfies Parameters<typeof buildSurveyResult>[0];

  const result = buildSurveyResult(input);

  assert.deepEqual(result.depth, {
    use: 0,
    workflow: 0,
    integrate: 0,
    build: 9,
    core: 100,
  });
  assert.equal(result.primaryDepth, "core");
  assert.equal(result.version, "1.0");
  assert.deepEqual(result.domains, input.domains);
  assert.deepEqual(result.roles, input.roles);
  assert.deepEqual(result.capabilities, input.capabilities);
  assert.notStrictEqual(result.domains, input.domains);
  assert.notStrictEqual(result.roles, input.roles);
  assert.notStrictEqual(result.capabilities, input.capabilities);
});
