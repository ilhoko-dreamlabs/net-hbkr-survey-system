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
  S --> U
```

- `src/components/survey.tsx`: 응답자 정보, 동의, 설문 입력과 결과 화면을 관리하는 Client Component
- `src/app/actions/submit-survey.ts`: 서버 측 재검증, 허니팟 확인, 이메일 기준 시간당 5회 제한, 계산 및 저장
- `src/lib/submission-schema.ts`: 허용 enum, 길이, 중복, 대표 선택 포함 여부, 동의 버전을 검증하는 Zod 스키마
- `src/lib/survey-data.ts`: 설문 기준 데이터와 AI Depth 가중 점수 계산
- `src/db/schema.ts`: `survey_submissions` Drizzle 모델
- `src/db/migrations/0000_init.sql`: Drizzle journal/snapshot과 함께 관리되는 초기 테이블, 제약조건, 인덱스 및 동시 제출 제한 트리거
- `src/app/api/maintenance/purge-expired/route.ts`: `CRON_SECRET`으로 보호되는 1년 초과 응답 자동 파기 작업
- `src/app/privacy/page.tsx`: 개인정보 수집·이용 안내
- `tests/`: DB 연결 없이 실행하는 점수 및 입력 계약 단위 테스트

저장 행에는 이름, 정규화된 이메일, 선택 입력인 소속·직책, 동의 상태와 버전, 마케팅 이메일 확인 시각, 원본 설문 응답 JSON, 계산 결과 JSON, 제출 시각이 포함됩니다. `DATABASE_URL`과 `CRON_SECRET`은 서버에서만 읽으며 브라우저 번들에 노출하지 않습니다.

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
```

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
| `npm run check` | lint, typecheck, test, build 전체 검증 |
| `npm run db:generate` | Drizzle migration 생성 |
| `npm run db:migrate` | `.env.local`을 읽어 migration 적용 |
| `npm run db:studio` | Drizzle Studio 실행 |

배포 전에는 `npm run check`를 통과시키고 실제 Preview에서 한 건을 제출해 저장 행과 결과 JSON을 함께 확인합니다. 테스트 데이터는 확인 직후 삭제하거나 별도 Preview DB를 폐기합니다.

## Vercel 배포

가장 단순한 운영 방식은 GitHub 연동입니다.

1. Vercel Dashboard에서 **New Project**를 선택하고 이 GitHub 저장소를 import합니다.
2. Framework Preset은 Next.js, Root Directory는 저장소 루트로 둡니다.
3. Project Settings → Environment Variables에서 Production용 `DATABASE_URL`, `CRON_SECRET`, `SURVEY_GLOBAL_HOURLY_LIMIT`을 등록합니다. Preview를 사용할 경우 Preview 전용 값을 별도로 등록합니다.
4. 먼저 Neon migration을 적용한 뒤 배포합니다. `main` 브랜치 push는 Production, 다른 브랜치와 Pull Request는 Preview 배포가 됩니다.
5. Production 배포 뒤 Vercel Cron 화면에서 `/api/maintenance/purge-expired`가 매일 18:15 UTC에 등록됐는지 확인합니다.
6. 배포 로그에 secret이 출력되지 않았는지 확인하고, Preview에서 전체 제출 흐름을 검증한 후 Production으로 병합합니다.

CLI를 사용하는 경우 프로젝트를 연결한 뒤 `vercel`로 Preview, `vercel --prod`로 Production 배포를 만들 수 있습니다. `.vercel/`과 토큰은 커밋하지 않습니다. Vercel의 현재 Git 배포 절차는 [공식 Git 문서](https://vercel.com/docs/git)를 참고하세요.

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
