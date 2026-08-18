import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { loginAdmin } from "../actions";
import { hasAdminSession, isAdminConfigured } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "관리자 로그인 | HBKR Survey",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await hasAdminSession()) redirect("/admin");
  const { error } = await searchParams;
  const configured = isAdminConfigured();

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <p className="eyebrow">HBKR Survey · Admin</p>
        <h1>관리자 로그인</h1>
        <p className="admin-login-copy">설문 참여 현황과 응답 결과를 확인합니다.</p>

        <form action={loginAdmin} className="admin-login-form">
          <label>
            <span>아이디</span>
            <input name="username" type="text" autoComplete="username" required maxLength={120} />
          </label>
          <label>
            <span>패스워드</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={500}
            />
          </label>
          {error === "invalid" ? (
            <p className="admin-form-error" role="alert">아이디 또는 패스워드를 확인해 주세요.</p>
          ) : null}
          {!configured || error === "config" ? (
            <p className="admin-form-error" role="alert">관리자 환경변수가 아직 설정되지 않았습니다.</p>
          ) : null}
          <button className="button primary-button" type="submit" disabled={!configured}>
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}
