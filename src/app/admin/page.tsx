import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAdmin } from "./actions";
import { hasAdminSession } from "@/lib/admin-auth";
import {
  getAdminDashboardData,
  getSubmissionDetail,
  resultLabel,
} from "@/lib/admin-data";
import { depthQuestions } from "@/lib/survey-data";

export const metadata: Metadata = {
  title: "관리자 대시보드 | HBKR Survey",
  robots: { index: false, follow: false },
};

type AdminPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    respondent?: string;
  }>;
};

const answerLabels = ["0 · 해당 없음", "1", "2", "3", "4 · 매우 그렇다"];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function chartWidth(count: number, maximum: number) {
  return `${count > 0 && maximum > 0 ? Math.max(3, (count / maximum) * 100) : 0}%`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const query = params.q ?? "";
  const [dashboard, selected] = await Promise.all([
    getAdminDashboardData(page, query),
    getSubmissionDetail(params.respondent),
  ]);

  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (dashboard.query) next.set("q", dashboard.query);
    next.set("page", String(nextPage));
    return `/admin?${next.toString()}`;
  };

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">HBKR Survey · Admin</p>
          <h1>참여 현황</h1>
          <p>응답자, 문항 선택과 포지셔닝 결과를 한눈에 확인합니다.</p>
        </div>
        <form action={logoutAdmin}>
          <button className="button secondary-button" type="submit">로그아웃</button>
        </form>
      </header>

      <section className="admin-summary-grid" aria-label="참여 요약">
        {[
          ["전체 응답", dashboard.summary.total],
          ["고유 이메일", dashboard.summary.uniqueRespondents],
          ["오늘", dashboard.summary.today],
          ["최근 7일", dashboard.summary.lastSevenDays],
        ].map(([label, value]) => (
          <article className="admin-summary-card" key={label}>
            <span>{label}</span>
            <strong>{Number(value).toLocaleString("ko-KR")}</strong>
          </article>
        ))}
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <div><span>RESULTS</span><h2>결과별 현황</h2></div>
          <p>대표 선택 기준 · 전체 누적 응답</p>
        </div>
        <div className="admin-chart-grid">
          {dashboard.charts.map((chart) => {
            const maximum = Math.max(0, ...chart.values.map((item) => item.count));
            return (
              <article className="admin-chart-card" key={chart.key}>
                <h3>{chart.label}</h3>
                {chart.values.length ? (
                  <div className="admin-bars">
                    {chart.values.map((item) => (
                      <div className="admin-bar-row" key={item.value}>
                        <div><span>{item.label}</span><strong>{item.count.toLocaleString("ko-KR")}</strong></div>
                        <div className="admin-bar-track"><span style={{ width: chartWidth(item.count, maximum) }} /></div>
                      </div>
                    ))}
                  </div>
                ) : <p className="admin-empty">아직 응답이 없습니다.</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <div><span>QUESTIONS</span><h2>문항별 선택 현황</h2></div>
          <p>0점부터 4점까지 선택 분포</p>
        </div>
        <div className="admin-question-grid">
          {dashboard.questions.map((question, index) => {
            const maximum = Math.max(0, ...question.counts.map((item) => item.count));
            return (
              <article className="admin-question-card" key={question.id}>
                <div className="admin-question-title">
                  <span>Q{index + 1}</span><h3>{question.text}</h3><strong>{question.total}명</strong>
                </div>
                <div className="admin-bars compact">
                  {question.counts.map((item) => (
                    <div className="admin-bar-row" key={item.value}>
                      <div><span>{answerLabels[item.value]}</span><strong>{item.count}</strong></div>
                      <div className="admin-bar-track"><span style={{ width: chartWidth(item.count, maximum) }} /></div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head respondent-head">
          <div><span>RESPONDENTS</span><h2>응답자 리스트</h2></div>
          <form className="admin-search" action="/admin" method="get">
            <input name="q" defaultValue={dashboard.query} placeholder="이름, 이메일, 소속 검색" />
            <button className="button secondary-button" type="submit">검색</button>
          </form>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>응답자</th><th>소속 / 직무</th><th>결과</th><th>제출 시각</th><th /></tr></thead>
            <tbody>
              {dashboard.submissions.map((submission) => (
                <tr key={submission.id}>
                  <td><strong>{submission.name}</strong><small>{submission.email}</small></td>
                  <td>{submission.organization || "—"}<small>{submission.jobTitle || ""}</small></td>
                  <td><strong>{resultLabel("domain", submission.computedResult.primaryDomain)}</strong><small>{resultLabel("depth", submission.computedResult.primaryDepth)} · {resultLabel("role", submission.computedResult.primaryRole)}</small></td>
                  <td>{formatDate(submission.submittedAt)}</td>
                  <td><Link className="admin-detail-link" href={`/admin?respondent=${submission.id}#respondent-detail`}>상세</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!dashboard.submissions.length ? <p className="admin-empty table-empty">검색 결과가 없습니다.</p> : null}
        </div>
        <nav className="admin-pagination" aria-label="응답자 목록 페이지">
          {dashboard.pagination.page > 1 ? <Link href={pageHref(dashboard.pagination.page - 1)}>← 이전</Link> : <span />}
          <span>{dashboard.pagination.page} / {dashboard.pagination.totalPages} · {dashboard.pagination.total.toLocaleString("ko-KR")}건</span>
          {dashboard.pagination.page < dashboard.pagination.totalPages ? <Link href={pageHref(dashboard.pagination.page + 1)}>다음 →</Link> : <span />}
        </nav>
      </section>

      {selected ? (
        <section className="admin-section admin-detail" id="respondent-detail">
          <div className="admin-section-head">
            <div><span>RESPONSE DETAIL</span><h2>{selected.name} 응답 결과</h2></div>
            <Link className="admin-detail-link" href="/admin">닫기</Link>
          </div>
          <div className="admin-detail-meta">
            <dl><dt>이메일</dt><dd>{selected.email}</dd><dt>소속</dt><dd>{selected.organization || "—"}</dd><dt>직무</dt><dd>{selected.jobTitle || "—"}</dd><dt>제출</dt><dd>{formatDate(selected.submittedAt)}</dd></dl>
            <dl><dt>도메인</dt><dd>{resultLabel("domain", selected.computedResult.primaryDomain)}</dd><dt>AI Depth</dt><dd>{resultLabel("depth", selected.computedResult.primaryDepth)}</dd><dt>역할</dt><dd>{resultLabel("role", selected.computedResult.primaryRole)}</dd><dt>성숙도</dt><dd>{resultLabel("maturity", selected.computedResult.maturity)}</dd></dl>
          </div>
          <div className="admin-depth-scores">
            {Object.entries(selected.computedResult.depth).map(([key, score]) => (
              <div key={key}><span>{resultLabel("depth", key)}</span><strong>{score}</strong><div className="admin-bar-track"><span style={{ width: `${score}%` }} /></div></div>
            ))}
          </div>
          <div className="admin-detail-columns">
            <div><h3>Capabilities</h3><div className="pill-row">{selected.computedResult.capabilities.map((value) => <span className="pill" key={value}>{resultLabel("capability", value)}</span>)}</div></div>
            <div><h3>문항 응답</h3><ol>{selected.rawAnswers.depthAnswers.map((answer, index) => <li key={depthQuestions[index]?.id ?? index}><span>Q{index + 1}</span><strong>{answer}점</strong></li>)}</ol></div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
