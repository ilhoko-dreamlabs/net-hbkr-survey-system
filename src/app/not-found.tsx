import Link from "next/link";

export default function NotFound() {
  return (
    <main className="legal-shell">
      <article className="legal-card compact-card">
        <p className="eyebrow">404</p>
        <h1>페이지를 찾을 수 없습니다.</h1>
        <p>주소를 다시 확인하거나 설문 첫 화면으로 돌아가 주세요.</p>
        <Link className="button primary-button inline-button" href="/">
          설문으로 돌아가기
        </Link>
      </article>
    </main>
  );
}
