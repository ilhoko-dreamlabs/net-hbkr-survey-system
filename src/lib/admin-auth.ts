import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "hbkr_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

type AdminSession = {
  sub: string;
  exp: number;
};

function adminConfig() {
  return {
    username: process.env.ADMIN_USERNAME?.trim() ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
    secret: process.env.ADMIN_SESSION_SECRET ?? "",
  };
}

export function isAdminConfigured() {
  const config = adminConfig();
  return Boolean(
    config.username && config.password && config.secret.length >= 32,
  );
}

function constantTimeEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionToken(username: string, secret: string) {
  const session: AdminSession = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

function verifySessionToken(token: string) {
  const config = adminConfig();
  if (!isAdminConfigured()) return false;

  const [payload, providedSignature, extra] = token.split(".");
  if (!payload || !providedSignature || extra) return false;
  if (!constantTimeEqual(providedSignature, signature(payload, config.secret))) {
    return false;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AdminSession>;
    return (
      session.sub === config.username &&
      typeof session.exp === "number" &&
      session.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function validateAdminCredentials(username: string, password: string) {
  const config = adminConfig();
  if (!isAdminConfigured()) return false;
  return (
    constantTimeEqual(username, config.username) &&
    constantTimeEqual(password, config.password)
  );
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  return token ? verifySessionToken(token) : false;
}

export async function createAdminSession() {
  const config = adminConfig();
  if (!isAdminConfigured()) {
    throw new Error("Admin authentication is not configured.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createSessionToken(config.username, config.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });
}
