import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("result email delivery skips safely when server credentials are absent", async () => {
  // The production module is marked server-only. A child process with the
  // react-server condition exercises that real boundary without mocking or
  // making an external SMTP request.
  const script = String.raw`
    const {
      sendSurveyResultEmail,
      isSurveyResultEmailConfigured,
    } = await import("./src/lib/email.ts");

    const warnings = [];
    console.warn = (...values) => warnings.push(values.map(String).join(" "));

    await sendSurveyResultEmail({
      to: "respondent@example.com",
      name: "홍길동",
      submissionId: "submission-without-email-config",
      submittedAt: "2026-08-14T12:00:00.000Z",
      result: {
        version: "1.0",
        primaryDomain: "software",
        domains: ["software"],
        depth: { use: 50, workflow: 60, integrate: 70, build: 80, core: 20 },
        primaryDepth: "build",
        roles: ["builder"],
        primaryRole: "builder",
        maturity: "production",
        capabilities: ["agent"],
      },
    });

    process.stdout.write(JSON.stringify({
      configured: isSurveyResultEmailConfigured(),
      warnings,
    }));
  `;

  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "--input-type=module",
      "--eval",
      script,
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SMTP_USER: "",
        SMTP_PASSWORD: "",
        SURVEY_EMAIL_FROM: "",
      },
      timeout: 10_000,
    },
  );

  assert.equal(stderr, "");
  const output = JSON.parse(stdout) as {
    configured: boolean;
    warnings: string[];
  };

  assert.equal(output.configured, false);
  assert.equal(output.warnings.length, 1);
  assert.match(output.warnings[0], /submission-without-email-config/u);
  assert.match(output.warnings[0], /SMTP_USER/u);
  assert.match(output.warnings[0], /SMTP_PASSWORD/u);
  assert.match(output.warnings[0], /SURVEY_EMAIL_FROM/u);
});
