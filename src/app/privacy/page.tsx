import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <article className="legal-card">
        <p className="eyebrow">HBKR · Privacy</p>
        <h1>개인정보 수집·이용 안내</h1>
        <p className="legal-updated">시행일: 2026년 8월 18일 · 안내 버전: 2026-08-18</p>

        <section>
          <h2>수집 목적</h2>
          <p>
            AI Positioning Survey 결과 생성·저장, 입력한 이메일로 결과 전송, 응답 이력 관리와 요청한 경우의 후속
            안내를 위해 사용합니다.
          </p>
        </section>

        <section>
          <h2>수집 항목</h2>
          <p>필수 항목은 이름, 이메일, 설문 응답과 동의 기록입니다. 소속과 직무는 선택 항목입니다.</p>
        </section>

        <section>
          <h2>결과 메일 전송</h2>
          <p>
            결과 메일 전송을 위해 입력한 이메일 주소, 이름과 결과 요약이 Dreamlabs의 Google Workspace 계정과
            Google 메일 시스템에서 처리될 수 있습니다. 마케팅 소식은 별도의 선택 동의와 이메일 소유 확인 없이는
            발송하지 않습니다.
          </p>
        </section>

        <section>
          <h2>보유 기간</h2>
          <p>
            제출일로부터 1년 동안 보관하며, 보유 기간이 지난 응답은 운영 데이터베이스에서 매일 자동 삭제합니다.
            관계 법령에 별도 보존 의무가 있는 경우에는 해당 기간 동안 분리 보관할 수 있습니다.
          </p>
        </section>

        <section>
          <h2>동의 거부와 문의</h2>
          <p>
            필수 수집에 동의하지 않을 수 있으나, 이 경우 서버에 결과를 저장하거나 이메일로 전송할 수 없습니다.
            열람·정정·삭제 요청은{" "}
            <a className="text-link" href="mailto:privacy@hbkr.net">
              privacy@hbkr.net
            </a>
            으로 접수할 수 있습니다. 개인정보 처리 주체는 HBKR입니다.
          </p>
        </section>

        <div className="legal-notice">
          선택 항목인 소식 수신 의사는 이메일 소유 확인을 마친 뒤에만 구독으로 전환됩니다. 설문 응답은 자격이나
          채용 평가를 위한 외부 검증 자료가 아닙니다.
        </div>

        <Link className="text-link" href="/">
          ← 설문으로 돌아가기
        </Link>
      </article>
    </main>
  );
}
