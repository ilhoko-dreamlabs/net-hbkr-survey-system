import assert from "node:assert/strict";
import test from "node:test";

import { surveySubmissionSchema } from "../src/lib/submission-schema";

function validSubmission() {
  return {
    respondent: {
      name: "Alice",
      email: "alice@example.com",
      organization: "HBKR",
      jobTitle: "Researcher",
    },
    domains: ["software", "research"],
    primaryDomain: "software",
    depthAnswers: [0, 1, 2, 3, 4, 0, 1, 2, 3, 4],
    roles: ["builder", "researcher"],
    primaryRole: "builder",
    capabilities: ["text", "agent"],
    maturity: "production",
    privacyConsent: true,
    marketingConsent: false,
    privacyVersion: "2026-08-14",
    website: "",
  };
}

function issuePaths(input: unknown): string[] {
  const result = surveySubmissionSchema.safeParse(input);
  assert.equal(result.success, false);

  return result.error.issues.map((issue) => issue.path.map(String).join("."));
}

test("the schema normalizes respondent text and email before returning data", () => {
  const input = validSubmission();
  input.respondent = {
    name: "\u3000Ａｌｉｃｅ\u3000",
    email: "  ALICE@Example.COM  ",
    organization: "\u3000ＨＢＫＲ\u3000",
    jobTitle: "  ＡＩ Engineer  ",
  };

  const parsed = surveySubmissionSchema.parse(input);

  assert.deepEqual(parsed.respondent, {
    name: "Alice",
    email: "alice@example.com",
    organization: "HBKR",
    jobTitle: "AI Engineer",
  });
});

test("required privacy consent and the privacy notice version are enforced", () => {
  assert.ok(
    issuePaths({ ...validSubmission(), privacyConsent: false }).includes(
      "privacyConsent",
    ),
  );
  assert.ok(
    issuePaths({ ...validSubmission(), privacyVersion: "2026-01-01" }).includes(
      "privacyVersion",
    ),
  );
});

test("domain, role, capability, and maturity values must come from their enums", () => {
  const cases: Array<[unknown, string]> = [
    [{ ...validSubmission(), domains: ["unknown-domain"] }, "domains.0"],
    [{ ...validSubmission(), roles: ["unknown-role"] }, "roles.0"],
    [
      { ...validSubmission(), capabilities: ["unknown-capability"] },
      "capabilities.0",
    ],
    [{ ...validSubmission(), maturity: "unknown-maturity" }, "maturity"],
  ];

  for (const [input, expectedPath] of cases) {
    assert.ok(
      issuePaths(input).includes(expectedPath),
      `expected an enum issue at ${expectedPath}`,
    );
  }
});

test("primary domain and role must also be present in their selected arrays", () => {
  const paths = issuePaths({
    ...validSubmission(),
    domains: ["software"],
    primaryDomain: "research",
    roles: ["builder"],
    primaryRole: "researcher",
  });

  assert.ok(paths.includes("primaryDomain"));
  assert.ok(paths.includes("primaryRole"));
});

test("duplicate domain, role, and capability selections are rejected", () => {
  const paths = issuePaths({
    ...validSubmission(),
    domains: ["software", "software"],
    primaryDomain: "software",
    roles: ["builder", "builder"],
    primaryRole: "builder",
    capabilities: ["agent", "agent"],
  });

  assert.ok(paths.includes("domains"));
  assert.ok(paths.includes("roles"));
  assert.ok(paths.includes("capabilities"));
});

test("control characters in respondent fields are rejected", () => {
  const input = validSubmission();
  input.respondent.name = "Alice\nAdmin";

  assert.ok(issuePaths(input).includes("respondent.name"));
});
