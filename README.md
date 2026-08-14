# HBKR AI Positioning Survey

`survey.hbkr.net`에서 운영하기 위한 자기보고형 AI 포지셔닝 설문입니다. 응답자의 Domain, AI Depth, Role, Capability, Production Maturity를 구조화하고, 필수 개인정보 수집 동의를 받은 제출만 Neon Postgres에 저장합니다.

## 구조

```mermaid
flowchart LR
  U["브라우저 · 다단계 설문"] --> A["Next.js Server Action"]
  A --> V["Zod 검증·정규화"]
  V --> S["가중 점수·프로필 계산"]
  S --> D["Drizzle ORM"]
  D --> N["Neon Postgres"]
  D --> E["Resend · 결과 이메일"]
  S --> U
```

- `src/components/survey.tsx`: 응답자 정보, 동의, 설문 입력과 결과 화면을 관리하는 Client Component
- `src/app/actions/submit-survey.ts`: 서버 측 재검증, 허니팟 확인, 이메일 기준 시간당 5회 제한, 계산 및 저장
- `src/lib/submission-schema.ts`: 허용 enum, 길이, 중복, 대표 선택 포함 여부, 동의 버전을 검증하는 Zod 스키마
- `src/lib/survey-data.ts`: 설문 기준 데이터와 AI Depth 가중 점수 계산
- `src/lib/email.ts`, `src/emails/`: 저장된 결과를 이용한 best-effort 트랜잭션 이메일 전송과 템플릿
- `src/db/schema.ts`: `survey_submissions` Drizzle 모델
- `src/db/migrations/0000_init.sql`: Drizzle journal/snapshot과 함께 관리되는 초기 테이블, 제약조건, 인덱스 및 동시 제출 제한 트리거
- `src/app/api/maintenance/purge-expired/route.ts`: `CRON_SECRET`으로 보호되는 1년 초과 응답 자동 파기 작업
- `src/app/privacy/page.tsx`: 개인정보 수집·이용 안내
- `tests/`: DB 연결 없이 실행하는 점수 및 입력 계약 단위 테스트

저장 행에는 이름, 정규화된 이메일, 선택 입력인 소속·직책, 동의 상태와 버전, 마케팅 이메일 확인 시각, 원본 설문 응답 JSON, 계산 결과 JSON, 제출 시각이 포함됩니다. DB 저장이 성공한 뒤 결과 이메일을 별도로 시도합니다. `DATABASE_URL`, `CRON_SECRET`, `RESEND_API_KEY`는 서버에서만 읽으며 브라우저 번들에 노출하지 않습니다.

## 로컬 실행

요구 사항은 Node.js 20.9 이상, npm, 그리고 접근 가능한 Neon Postgres 데이터베이스입니다.

```powershell
npm ci
Copy-Item .env.example .env.local
```

`.env.local`에 Neon의 pooled connection string을 넣습니다. 변수 이름에 `NEXT_PUBLIC_`을 붙이지 마세요.

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
CRON_SECRET=32자 이상의 무작위_비밀값
SURVEY_GLOBAL_HOURLY_LIMIT=500
RESEND_API_KEY=
SURVEY_EMAIL_FROM="HBKR Survey <results@mail.hbkr.net>"
SURVEY_EMAIL_REPLY_TO=privacy@hbkr.net
SURVEY_SITE_URL=https://survey.hbkr.net
```

로컬에서 실제 메일이 필요하지 않으면 `RESEND_API_KEY`를 비워 둡니다. 이 경우 설문과 DB 저장은 정상 작동하고 이메일만 건너뜁니다. 실제 전송을 시험할 때만 별도 개발용 Resend key와 Resend에서 허용된 발신 주소를 사용하세요. 운영 key나 Production 수신자 데이터를 로컬 환경에서 사용하지 않습니다.

스키마를 적용하고 개발 서버를 시작합니다.

```powershell
npm run db:migrate
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. `DATABASE_URL`이 없거나 마이그레이션이 적용되지 않으면 화면은 열리지만 제출 저장은 실패합니다.

## Neon 데이터베이스와 마이그레이션

1. Neon에서 프로젝트와 데이터베이스를 만들고 애플리케이션 전용 role을 준비합니다.
2. Neon 콘솔의 pooled connection string을 `.env.local`의 `DATABASE_URL`에 설정합니다.
3. `npm run db:migrate`를 한 번 실행해 `src/db/migrations`의 journal에 등록된 변경을 적용합니다.
4. 운영 배포 전에 Neon SQL Editor에서 `survey_submissions` 테이블, 인덱스, `enforce_survey_submission_email_rate_limit` 트리거가 생성됐는지 확인합니다.
5. 이후 스키마를 바꾸면 `npm run db:generate`로 새 migration을 만들고 검토한 뒤 `npm run db:migrate`를 실행합니다. 이미 운영 중인 migration 파일을 수정하지 말고 새 파일을 추가합니다.

운영과 Preview 환경은 가능하면 별도 Neon database/branch와 별도 `DATABASE_URL`을 사용하세요. 마이그레이션은 애플리케이션 요청 중에 실행하지 않고 배포 전 별도 단계에서 한 번만 실행합니다.

## 검증과 스크립트

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | Next.js 개발 서버 |
| `npm run build` | 운영 빌드 |
| `npm start` | 빌드된 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 검사 |
| `npm test` | Node test runner 기반 단위 테스트 |
| `npm run check` | lint, typecheck, test, migration 정합성, build 전체 검증 |
| `npm run db:check` | Drizzle migration journal과 snapshot 정합성 검사 |
| `npm run db:generate` | Drizzle migration 생성 |
| `npm run db:migrate` | `.env.local`을 읽어 migration 적용 |
| `npm run db:studio` | Drizzle Studio 실행 |

배포 전에는 `npm run check`를 통과시키고 실제 Preview에서 한 건을 제출해 저장 행과 결과 JSON을 함께 확인합니다. 테스트 데이터는 확인 직후 삭제하거나 별도 Preview DB를 폐기합니다.

## Vercel 배포

운영 배포의 단일 경로는 `.github/workflows/deploy-vercel.yml`의 GitHub Actions입니다. Pull Request와 `main`
push에서 `npm run check`를 실행하고, 활성화된 `main` 실행은 Vercel 설정 pull → production artifact build → DB
migration → `--prebuilt` production deploy 순서로 진행합니다. Vercel Git 자동 배포는 중복 배포를 피하기 위해 연결하지
않거나 비활성화합니다.

1. Vercel Project의 Framework Preset은 Next.js, Root Directory는 저장소 루트로 둡니다.
2. Project Settings → Environment Variables에 Production용 `DATABASE_URL`, `CRON_SECRET`,
   `SURVEY_GLOBAL_HOURLY_LIMIT`, `SURVEY_EMAIL_FROM`, 선택값 `SURVEY_EMAIL_REPLY_TO`,
   `SURVEY_SITE_URL=https://survey.hbkr.net`을 등록합니다. 아래 Resend 연동의 `RESEND_API_KEY`도 Production 범위에
   연결합니다.
3. GitHub 저장소 변수 `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_SCOPE`를 Vercel 프로젝트 값으로 설정합니다.
4. Vercel Account Settings에서 CI 전용 token을 만들고 GitHub production environment secret `VERCEL_TOKEN`으로
   등록합니다. Neon에는 migration 전용 role을 준비하고 그 connection string을 같은 environment의 `DATABASE_URL`
   secret으로 등록합니다. 이 값들은 저장소 파일, 로그 또는 명령 인자에 넣지 않습니다.
5. 초기 준비가 모두 끝난 뒤 저장소 변수 `VERCEL_CI_ENABLED=true`로 바꾸고 Actions의 **Validate and deploy to
   Vercel** workflow를 `main`에서 수동 실행합니다. 준비 전에는 이 값이 `false`라서 검증 job만 실행됩니다.
6. Production 배포 뒤 Vercel Cron 화면에서 `/api/maintenance/purge-expired`가 매일 18:15 UTC에 등록됐는지,
   Actions summary의 production URL과 실제 저장·메일 전송이 정상인지 확인합니다.

워크플로는 Vercel CLI `59.0.0`을 고정해 사용합니다. `VERCEL_TOKEN`은 Vercel CLI 단계에만, migration
`DATABASE_URL`은 migration 단계에만 환경변수로 주입합니다. Production deploy는 직렬화되어 migration 이후 새 push가
기존 실행을 중간 취소하지 않습니다. 현재 CI/CD 구성은
[Vercel의 GitHub Actions 안내](https://vercel.com/docs/deployments/git/vercel-for-github)와 prebuilt deploy 패턴을
따릅니다. `.vercel/`, `.env.local`, token과 provider secret은 커밋하지 않습니다.

## 결과 이메일 (Resend)

결과 메일은 필수 동의로 저장된 응답자의 이메일 주소에 해당 제출의 포지셔닝 요약을 보내는 트랜잭션 알림입니다. 마케팅 동의 여부와 관계없이 제출 결과 안내 목적으로만 사용하며, 별도의 홍보 메일 대상 등록을 하지 않습니다.

### Marketplace와 발신 도메인 준비

1. Vercel Project의 Marketplace에서 **Resend**를 설치하고 이 프로젝트 및 사용할 환경(Production, 필요 시 Preview)에 연결합니다. 연동은 Vercel에 server-only `RESEND_API_KEY`를 생성합니다.
2. Resend Dashboard → Domains에서 전송 전용 하위 도메인(예: `mail.hbkr.net`)을 추가합니다. 루트 도메인과 평판을 분리할 수 있어 하위 도메인을 권장합니다.
3. Resend가 제시하는 MX/SPF 및 DKIM DNS 레코드를 `hbkr.net` DNS 공급자에 값 그대로 등록합니다. 웹 서비스의 `survey` CNAME과 메일 인증 레코드는 서로 다른 host에 두며, DNS 화면에서 Verified가 될 때까지 기다립니다.
4. `SURVEY_EMAIL_FROM`의 주소 domain은 인증한 domain과 일치시킵니다. 인증 후에는 그 domain의 원하는 local-part를 발신 주소로 쓸 수 있습니다.
5. `SURVEY_EMAIL_REPLY_TO`는 선택값입니다. 설정한다면 실제 수신·응대 가능한 메일함을 사용하세요. Resend의 발신 domain 인증은 Reply-To 메일함을 만들어 주지 않습니다.

| 변수 | 필수 여부 | 예시와 역할 |
| --- | --- | --- |
| `RESEND_API_KEY` | 전송 시 필수 | Marketplace가 주입하는 비밀 key. 저장소와 `NEXT_PUBLIC_*`에 절대 넣지 않음 |
| `SURVEY_EMAIL_FROM` | 전송 시 필수 | `HBKR Survey <results@mail.hbkr.net>`처럼 인증 domain을 사용한 발신자 |
| `SURVEY_EMAIL_REPLY_TO` | 선택 | 문의 답장을 받을 실제 메일함 |
| `SURVEY_SITE_URL` | 필수 | 이메일 링크 기준의 query/hash/path 없는 HTTPS origin. 기본값과 운영값은 `https://survey.hbkr.net` |

Production에서는 환경 변수를 저장한 뒤 다시 배포해야 새 값이 적용됩니다. 배포 후 실제 관리 주소로 설문 한 건을 제출해 본문, 링크, From/Reply-To, SPF·DKIM·DMARC 결과를 확인하세요. Resend Marketplace 동작은 [Vercel Marketplace 안내](https://vercel.com/marketplace/resend), 발신 API와 domain 설정은 [Resend 문서](https://resend.com/docs)를 기준으로 합니다.

### 저장과 메일 실패의 독립성

DB insert가 설문 제출의 성공 기준입니다. 저장이 완료된 뒤 이메일을 best-effort로 시도하므로 `RESEND_API_KEY` 미설정, Resend 일시 장애, 수신 거부나 template 전송 오류가 발생해도 이미 저장된 제출과 계산 결과를 롤백하지 않습니다. 사용자는 화면에서 저장된 결과를 계속 확인·다운로드할 수 있어야 합니다.

반대로 DB 저장이 실패하면 결과 이메일을 보내지 않습니다. 메일 발송 성공은 받은편지함 도착을 보장하지 않으므로 운영에서는 Resend의 delivered, bounced, complained, suppressed 상태를 별도로 관찰하세요. 현재 저장 행 자체가 메일 재시도 queue는 아니므로 무조건 재제출을 안내해 중복 데이터를 만들지 말고, 전송 이력·idempotency·관리자 재전송 정책을 먼저 마련한 뒤 재시도 기능을 운영하세요.

## `survey.hbkr.net` 연결 (외부 DNS)

DNS zone은 외부 공급자에서 유지한다는 전제입니다.

1. Vercel Project Settings → Domains에서 `survey.hbkr.net`을 먼저 추가합니다.
2. Vercel 화면 또는 `vercel domains inspect survey.hbkr.net`이 표시하는 **프로젝트별 정확한 CNAME 대상**을 확인합니다.
3. `hbkr.net` DNS 공급자에서 기존 `survey`의 충돌하는 A/AAAA/CNAME 레코드를 제거한 후 아래 레코드를 만듭니다.

   | Type | Name/Host | Value/Target |
   | --- | --- | --- |
   | CNAME | `survey` | Vercel이 해당 프로젝트에 제시한 CNAME target |

4. DNS proxy 기능이 있는 공급자는 최초 검증 동안 DNS-only로 두는 편이 안전합니다. TTL과 전파 시간을 기다린 뒤 Vercel Domains 화면 또는 `vercel domains inspect survey.hbkr.net`에서 `Valid Configuration`을 확인합니다.
5. DNS 검증 뒤 Vercel이 TLS 인증서를 발급하면 `https://survey.hbkr.net`에서 설문 표시, 개인정보 안내, 실제 저장을 점검합니다.

일반 예시값을 복사해 고정하지 말고 Vercel이 프로젝트에 표시한 값을 사용해야 합니다. 외부 DNS 흐름과 최신 명령은 [Vercel custom domain 공식 안내](https://vercel.com/docs/domains/set-up-custom-domain)에 정리되어 있습니다.

## 개인정보 및 운영 주의사항

- 개인정보 안내는 처리 주체를 HBKR, 요청 창구를 `privacy@hbkr.net`, 보유 기간을 1년으로 표시합니다. 공개 전에 해당 메일함이 실제로 수신 가능한지와 처리 위탁·국외 이전, 공급자 백업 만료 정책을 운영 기준과 함께 확인해야 합니다.
- `vercel.json`의 일일 Cron은 1년이 지난 운영 DB 행을 삭제합니다. Production 배포 후 첫 수동 호출과 로그로 권한 검사·삭제 건수·실패 알림을 확인하고, Neon 백업 보존 설정도 같은 정책에 맞추세요.
- Neon과 Vercel의 접근 권한을 최소화하고 MFA, secret 회전, 감사 로그, 백업·복구 정책을 운영해야 합니다. Production DB를 로컬 개발에 재사용하지 마세요.
- 마케팅 수신 의사는 선택값으로 저장되지만 `marketing_verified_at`은 이메일 소유 확인 전까지 비어 있습니다. 확인 메일과 철회 이력이 추가되기 전에는 이 값을 발송 대상 동의로 사용하지 마세요.
- 애플리케이션이 IP 주소를 DB에 명시적으로 저장하지 않아도 호스팅·보안 로그에 요청 메타데이터가 남을 수 있습니다. 각 공급자의 로그 보존과 접근 정책을 개인정보 안내와 일치시키세요.
- 이메일 기준 시간당 5회, 전체 기본 시간당 500회 제한과 허니팟은 DB 오염을 줄이는 기본 장치입니다. 공개 캠페인 전에는 Vercel Firewall rate limit과 CAPTCHA를 추가하고 임계치는 예상 트래픽에 맞춰 조정하세요.
- 설문 결과는 자기보고형 프로파일이며 자격, 채용 평가 또는 외부 검증형 역량 인증으로 사용하도록 설계되지 않았습니다.

## 원본 아카이브 출처

초기 제공물은 `archive/ai-positioning-survey-v0.1.zip`으로 보존합니다. ZIP 내부의 `ai-positioning-survey/index.html`과 `README.md`는 각각 `archive/index-v0.1.html`, `archive/README-v0.1.md`로 이름만 명확히 해 추출했으며 바이트 단위로 동일합니다.

| 파일 | 크기 | SHA-256 |
| --- | ---: | --- |
| `archive/ai-positioning-survey-v0.1.zip` | 8,587 bytes | `6D54982A908CF234A793BE15500341C0A71483677C1C7D30956F05861C15E768` |
| `archive/index-v0.1.html` | 22,305 bytes | `8CDE3832138E463BBA984CD9E21A44E6C612AE0DA806F227DD7D867C4D4CD2F9` |
| `archive/README-v0.1.md` | 563 bytes | `C03108E81802E83D971E3C8B9A485FA878474BAEC6828FABDD3E08490006E65C` |

원본 v0.1은 브라우저에서 단독 실행하는 정적 HTML이며 서버 저장과 사용자 정보 수집은 범위 밖이었습니다. 현재 애플리케이션은 원본을 덮어쓰지 않고 별도의 Next.js, 서버 검증, 데이터베이스 저장 구조로 확장한 버전입니다.
