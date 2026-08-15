import type { CSSProperties } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

import {
  capabilities,
  depthLabels,
  domains,
  maturityLevels,
  roles,
  type SurveyResult,
} from "../lib/survey-data";
import { buildSurveyInsight } from "../lib/survey-insights";

export type SurveyResultEmailProps = {
  name: string;
  submissionId: string;
  submittedAt: string;
  result: SurveyResult;
  siteUrl: string;
};

function labelFor<T extends string>(
  items: readonly { value: T; label: string }[],
  value: T,
) {
  return items.find((item) => item.value === value)?.label ?? value;
}

function formatSubmittedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function SurveyResultEmail({
  name,
  submissionId,
  submittedAt,
  result,
  siteUrl,
}: SurveyResultEmailProps) {
  const domainLabel = labelFor(domains, result.primaryDomain);
  const roleLabel = labelFor(roles, result.primaryRole);
  const maturityLabel = labelFor(maturityLevels, result.maturity);
  const primaryDepth = depthLabels[result.primaryDepth];
  const capabilityLabels = result.capabilities.map((value) =>
    labelFor(capabilities, value),
  );
  const insight = buildSurveyInsight(result);
  const normalizedSiteUrl = siteUrl.replace(/\/+$/u, "");

  return (
    <Html lang="ko">
      <Head />
      <Preview>AI Positioning Survey 제출 결과를 확인하세요.</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={brandStyle}>HBKR · AI POSITIONING SURVEY</Text>
          <Heading style={headingStyle}>{name}님의 AI 포지셔닝 결과</Heading>
          <Text style={leadStyle}>
            설문 제출이 완료되었습니다. 현재 응답에서 가장 두드러진 조합은
            아래와 같습니다.
          </Text>

          <Section style={heroStyle}>
            <Text style={eyebrowStyle}>AI POSITIONING PROFILE</Text>
            <Heading as="h2" style={profileStyle}>
              {insight.archetype}
            </Heading>
            <Text style={summaryStyle}>
              {domainLabel} × {primaryDepth.label}
              <br />
              {insight.tagline}
            </Text>
          </Section>

          <Heading as="h3" style={sectionHeadingStyle}>
            응답에서 읽힌 패턴
          </Heading>
          <Text style={bodyTextStyle}>{insight.signal}</Text>

          <Section style={metricsStyle}>
            <Text style={metricStyle}>
              <span style={metricLabelStyle}>PRIMARY DOMAIN</span>
              <br />
              <strong>{domainLabel}</strong>
            </Text>
            <Text style={metricStyle}>
              <span style={metricLabelStyle}>PRIMARY ROLE</span>
              <br />
              <strong>{roleLabel}</strong>
            </Text>
            <Text style={metricStyle}>
              <span style={metricLabelStyle}>PRODUCTION MATURITY</span>
              <br />
              <strong>{maturityLabel}</strong>
            </Text>
          </Section>

          <Heading as="h3" style={sectionHeadingStyle}>
            AI Depth Shape
          </Heading>
          <Section>
            {Object.entries(result.depth).map(([key, value]) => {
              const depthKey = key as keyof typeof depthLabels;
              const width = `${Math.min(100, Math.max(0, value))}%`;

              return (
                <Section key={key} style={barRowStyle}>
                  <Text style={barLabelStyle}>
                    {depthLabels[depthKey].label}
                    <span style={scoreStyle}>{value}</span>
                  </Text>
                  <Section style={barTrackStyle}>
                    <Section style={{ ...barValueStyle, width }}>&nbsp;</Section>
                  </Section>
                </Section>
              );
            })}
          </Section>

          <Heading as="h3" style={sectionHeadingStyle}>
            Selected Capabilities
          </Heading>
          <Text style={bodyTextStyle}>
            {capabilityLabels.length ? capabilityLabels.join(" · ") : "선택 없음"}
          </Text>

          <Section style={actionSectionStyle}>
            <Text style={actionEyebrowStyle}>NEXT 7 DAYS · 3 QUESTS</Text>
            <Heading as="h3" style={actionHeadingStyle}>
              결과를 행동으로 바꿔보세요
            </Heading>
            {insight.actions.map((action, index) => (
              <Text style={actionItemStyle} key={action}>
                <strong>{index + 1}.</strong> {action}
              </Text>
            ))}
          </Section>

          <Button href={normalizedSiteUrl} style={buttonStyle}>
            설문 사이트 다시 보기
          </Button>

          <Hr style={dividerStyle} />
          <Text style={referenceStyle}>
            제출 ID: {submissionId}
            <br />
            제출 시각: {formatSubmittedAt(submittedAt)} (KST)
          </Text>
          <Text style={footerStyle}>
            이 결과는 자기보고형 프로파일이며 자격이나 실무 능력을 외부 검증한
            평가가 아닙니다. 개인정보 처리 내용은{" "}
            <Link href={`${normalizedSiteUrl}/privacy`} style={footerLinkStyle}>
              개인정보 처리 안내
            </Link>
            에서 확인할 수 있습니다.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default SurveyResultEmail;

const bodyStyle: CSSProperties = {
  backgroundColor: "#f3f4f6",
  color: "#111827",
  fontFamily:
    "Inter, Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: "32px 12px",
};

const containerStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  margin: "0 auto",
  maxWidth: "620px",
  padding: "38px 34px",
};

const brandStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  margin: "0 0 18px",
};

const headingStyle: CSSProperties = {
  fontSize: "28px",
  letterSpacing: "-0.03em",
  lineHeight: 1.25,
  margin: "0 0 12px",
};

const leadStyle: CSSProperties = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: 1.7,
  margin: "0 0 24px",
};

const heroStyle: CSSProperties = {
  backgroundColor: "#111827",
  borderRadius: "14px",
  color: "#ffffff",
  padding: "24px",
};

const eyebrowStyle: CSSProperties = {
  color: "#d1d5db",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  margin: "0 0 8px",
};

const profileStyle: CSSProperties = {
  color: "#ffffff",
  fontSize: "25px",
  letterSpacing: "-0.02em",
  margin: "0 0 10px",
};

const summaryStyle: CSSProperties = {
  color: "#e5e7eb",
  fontSize: "14px",
  lineHeight: 1.7,
  margin: 0,
};

const metricsStyle: CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
  padding: "12px 0 16px",
};

const metricStyle: CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  lineHeight: 1.6,
  margin: "12px 0 0",
};

const metricLabelStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: "17px",
  margin: "26px 0 12px",
};

const barRowStyle: CSSProperties = { marginBottom: "10px" };

const barLabelStyle: CSSProperties = {
  color: "#374151",
  fontSize: "12px",
  fontWeight: 600,
  margin: "0 0 5px",
};

const scoreStyle: CSSProperties = { float: "right" };

const barTrackStyle: CSSProperties = {
  backgroundColor: "#eef2f7",
  borderRadius: "999px",
  height: "8px",
  overflow: "hidden",
};

const barValueStyle: CSSProperties = {
  backgroundColor: "#111827",
  borderRadius: "999px",
  height: "8px",
  lineHeight: "8px",
};

const bodyTextStyle: CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: 1.7,
  margin: "0 0 24px",
};

const actionSectionStyle: CSSProperties = {
  backgroundColor: "#eef3ce",
  borderRadius: "14px",
  margin: "26px 0",
  padding: "22px",
};

const actionEyebrowStyle: CSSProperties = {
  color: "#37634e",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.09em",
  margin: "0 0 7px",
};

const actionHeadingStyle: CSSProperties = {
  color: "#173e2d",
  fontSize: "19px",
  margin: "0 0 15px",
};

const actionItemStyle: CSSProperties = {
  color: "#294436",
  fontSize: "13px",
  lineHeight: 1.65,
  margin: "9px 0 0",
};

const buttonStyle: CSSProperties = {
  backgroundColor: "#111827",
  borderRadius: "10px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 700,
  padding: "12px 18px",
  textDecoration: "none",
};

const dividerStyle: CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "30px 0 18px",
};

const referenceStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  lineHeight: 1.7,
  margin: "0 0 10px",
};

const footerStyle: CSSProperties = {
  color: "#9ca3af",
  fontSize: "11px",
  lineHeight: 1.65,
  margin: 0,
};

const footerLinkStyle: CSSProperties = {
  color: "#6b7280",
  textDecoration: "underline",
};
