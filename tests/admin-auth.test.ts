import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("admin credentials require complete configuration and compare exactly", async () => {
  const script = String.raw`
    const { isAdminConfigured, validateAdminCredentials } = await import("./src/lib/admin-auth.ts");
    process.stdout.write(JSON.stringify({
      configured: isAdminConfigured(),
      valid: validateAdminCredentials("survey-admin", "correct horse battery staple"),
      wrongUsername: validateAdminCredentials("Survey-Admin", "correct horse battery staple"),
      wrongPassword: validateAdminCredentials("survey-admin", "wrong"),
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
        ADMIN_USERNAME: "survey-admin",
        ADMIN_PASSWORD: "correct horse battery staple",
        ADMIN_SESSION_SECRET: "a-secure-session-secret-with-32-characters",
      },
      timeout: 10_000,
    },
  );

  assert.equal(stderr, "");
  assert.deepEqual(JSON.parse(stdout), {
    configured: true,
    valid: true,
    wrongUsername: false,
    wrongPassword: false,
  });
});

test("admin authentication stays disabled with a short session secret", async () => {
  const script = String.raw`
    const { isAdminConfigured } = await import("./src/lib/admin-auth.ts");
    process.stdout.write(JSON.stringify({ configured: isAdminConfigured() }));
  `;
  const { stdout } = await execFileAsync(
    process.execPath,
    ["--conditions=react-server", "--import", "tsx", "--input-type=module", "--eval", script],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_USERNAME: "survey-admin",
        ADMIN_PASSWORD: "password",
        ADMIN_SESSION_SECRET: "too-short",
      },
      timeout: 10_000,
    },
  );
  assert.deepEqual(JSON.parse(stdout), { configured: false });
});
