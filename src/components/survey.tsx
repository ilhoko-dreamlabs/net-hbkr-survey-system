"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { submitSurvey } from "@/app/actions/submit-survey";
import {
  capabilities,
  depthLabels,
  depthQuestions,
  domains,
  maturityLevels,
  roles,
  type CapabilityValue,
  type DomainValue,
  type MaturityValue,
  type RoleValue,
  type SurveyResult,
} from "@/lib/survey-data";

const stepLabels = ["기본 정보", "Domain", "AI Depth", "Role", "Maturity"] as const;

type FormState = {
  respondent: {
    name: string;
    email: string;
    organization: string;
    jobTitle: string;
  };
  domains: DomainValue[];
  primaryDomain: DomainValue | "";
  depthAnswers: number[];
  roles: RoleValue[];
  primaryRole: RoleValue | "";
  capabilities: CapabilityValue[];
  maturity: MaturityValue | "";
  privacyConsent: boolean;
  marketingConsent: boolean;
  website: string;
};

type StoredResult = {
  submissionId: string;
  submittedAt: string;
  result: SurveyResult;
  emailDelivery: "scheduled" | "not_configured";
};

const initialForm: FormState = {
  respondent: { name: "", email: "", organization: "", jobTitle: "" },
  domains: [],
  primaryDomain: "",
  depthAnswers: Array.from({ length: depthQuestions.length }, () => -1),
  roles: [],
  primaryRole: "",
  capabilities: [],
  maturity: "",
  privacyConsent: false,
  marketingConsent: false,
  website: "",
};

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function labelFor<T extends string>(items: readonly { value: T; label: string }[], value: T) {
  return items.find((item) => item.value === value)?.label ?? value;
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function Survey() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storedResult, setStoredResult] = useState<StoredResult | null>(null);
  const [copyLabel, setCopyLabel] = useState("결과 복사");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const selectedDomains = useMemo(
    () => domains.filter((domain) => form.domains.includes(domain.value)),
    [form.domains],
  );
  const selectedRoles = useMemo(
    () => roles.filter((role) => form.roles.includes(role.value)),
    [form.roles],
  );

  function moveToStep(nextStep: number) {
    setStepError("");
    setStep(nextStep);
    window.setTimeout(() => {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (form.respondent.name.trim().length < 2) return "이름을 2자 이상 입력해 주세요.";
      if (!validateEmail(form.respondent.email)) return "연락 가능한 이메일 주소를 확인해 주세요.";
      if (!form.privacyConsent) return "결과 저장을 위해 필수 개인정보 수집·이용 동의가 필요합니다.";
    }

    if (step === 1) {
      if (form.domains.length === 0) return "Domain을 하나 이상 선택해 주세요.";
      if (!form.primaryDomain || !form.domains.includes(form.primaryDomain)) {
        return "선택한 Domain 중 대표 Domain을 지정해 주세요.";
      }
    }

    if (step === 2 && form.depthAnswers.some((answer) => answer < 0)) {
      return "AI Depth의 모든 문항에 응답해 주세요.";
    }

    if (step === 3) {
      if (form.roles.length === 0) return "현재 수행하는 Role을 하나 이상 선택해 주세요.";
      if (!form.primaryRole || !form.roles.includes(form.primaryRole)) {
        return "선택한 Role 중 대표 Role을 지정해 주세요.";
      }
    }

    if (step === 4 && !form.maturity) return "Production Maturity를 선택해 주세요.";
    return "";
  }

  function handleNext() {
    const error = validateCurrentStep();
    if (error) {
      setStepError(error);
      return;
    }
    moveToStep(Math.min(step + 1, stepLabels.length - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step < stepLabels.length - 1) {
      handleNext();
      return;
    }

    const error = validateCurrentStep();
    if (error) {
      setStepError(error);
      return;
    }

    setIsSubmitting(true);
    setStepError("");

    try {
      const response = await submitSurvey({
        respondent: {
          name: form.respondent.name.trim(),
          email: form.respondent.email.trim(),
          organization: form.respondent.organization.trim() || undefined,
          jobTitle: form.respondent.jobTitle.trim() || undefined,
        },
        domains: form.domains,
        primaryDomain: form.primaryDomain as DomainValue,
        depthAnswers: form.depthAnswers,
        roles: form.roles,
        primaryRole: form.primaryRole as RoleValue,
        capabilities: form.capabilities,
        maturity: form.maturity as MaturityValue,
        privacyConsent: true,
        marketingConsent: form.marketingConsent,
        privacyVersion: "2026-08-14",
        website: form.website,
      });

      if (!response.ok) {
        const fieldErrors = response.fieldErrors ?? {};
        const firstField = Object.keys(fieldErrors)[0] ?? "";
        const firstMessage = Object.values(fieldErrors).flat()[0] ?? response.message;
        const errorStep = firstField.startsWith("respondent") || firstField.startsWith("privacy")
          ? 0
          : firstField.startsWith("domains") || firstField.startsWith("primaryDomain")
            ? 1
            : firstField.startsWith("depthAnswers")
              ? 2
              : firstField.startsWith("roles") ||
                  firstField.startsWith("primaryRole") ||
                  firstField.startsWith("capabilities")
                ? 3
                : 4;

        setStep(errorStep);
        setStepError(firstMessage);
        window.setTimeout(() => headingRef.current?.focus(), 0);
        return;
      }

      setStoredResult({
        submissionId: response.submissionId,
        submittedAt: response.submittedAt,
        result: response.result,
        emailDelivery: response.emailDelivery,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setStepError("저장 중 연결 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetSurvey() {
    setForm(initialForm);
    setStoredResult(null);
    setStep(0);
    setStepError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyResult() {
    if (!storedResult) return;

    const { result, submissionId } = storedResult;
    const text = [
      "AI Positioning Profile",
      `Primary Domain: ${labelFor(domains, result.primaryDomain)}`,
      `Primary Depth: ${depthLabels[result.primaryDepth].label}`,
      `Primary Role: ${labelFor(roles, result.primaryRole)}`,
      `Maturity: ${labelFor(maturityLevels, result.maturity)}`,
      `Submission ID: ${submissionId}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopyLabel("복사됨");
    window.setTimeout(() => setCopyLabel("결과 복사"), 1300);
  }

  function downloadResult() {
    if (!storedResult) return;
    const blob = new Blob([JSON.stringify(storedResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ai-positioning-${storedResult.submissionId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <div className="brand" aria-label="HBKR">
          <span className="brand-mark">HB</span>
          HBKR
        </div>
        <div className="top-meta">AI Positioning Survey · v1.0</div>
      </header>

      {!storedResult ? (
        <>
          <section className="hero" aria-labelledby="survey-title">
            <div>
              <p className="eyebrow">Find your AI position</p>
              <h1 id="survey-title">나는 AI를 어디에서, 어떤 방식으로 쓰고 있는가?</h1>
              <p className="hero-copy">
                AI 실력을 한 줄로 서열화하지 않습니다. Domain, AI Depth, Role, Production Maturity를 통해 지금의
                활용 포지션을 설명 가능한 모양으로 만듭니다.
              </p>
            </div>
            <aside className="hero-aside" aria-label="설문 안내">
              <div className="hero-stat">
                <span>예상 시간</span>
                <strong>약 5–7분</strong>
              </div>
              <div className="hero-stat">
                <span>문항 구성</span>
                <strong>5개 영역</strong>
              </div>
              <div className="hero-stat">
                <span>결과</span>
                <strong>즉시 확인</strong>
              </div>
            </aside>
          </section>

          <section className="survey-card" aria-label="AI 포지셔닝 설문">
            <div className="progress-shell">
              <div className="progress-head">
                <span>{stepLabels[step]}</span>
                <span>
                  {step + 1} / {stepLabels.length}
                </span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={stepLabels.length}
                aria-valuenow={step + 1}
                aria-label="설문 진행률"
              >
                <div
                  className="progress-value"
                  style={{ width: `${((step + 1) / stepLabels.length) * 100}%` }}
                />
              </div>
            </div>

            <form className="step-panel" onSubmit={handleSubmit} noValidate>
              {step === 0 && (
                <>
                  <p className="step-kicker">Before we begin</p>
                  <h2 className="step-title" ref={headingRef} tabIndex={-1}>
                    결과를 저장하고 받을 기본 정보를 알려주세요.
                  </h2>
                  <p className="step-description">
                    이름과 이메일은 제출 결과를 구분하고 결과 메일을 보내는 데 사용합니다. 소속과 직무는 선택
                    사항입니다.
                  </p>

                  <div className="field-grid">
                    <label className="field">
                      <span className="field-label required">이름</span>
                      <input
                        className="text-input"
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        value={form.respondent.name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            respondent: { ...current.respondent, name: event.target.value },
                          }))
                        }
                        aria-invalid={Boolean(stepError && form.respondent.name.trim().length < 2)}
                        placeholder="홍길동"
                        required
                      />
                    </label>
                    <label className="field">
                      <span className="field-label required">이메일</span>
                      <input
                        className="text-input"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        maxLength={254}
                        value={form.respondent.email}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            respondent: { ...current.respondent, email: event.target.value },
                          }))
                        }
                        aria-invalid={Boolean(stepError && !validateEmail(form.respondent.email))}
                        placeholder="name@example.com"
                        required
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">소속</span>
                      <input
                        className="text-input"
                        type="text"
                        autoComplete="organization"
                        maxLength={120}
                        value={form.respondent.organization}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            respondent: { ...current.respondent, organization: event.target.value },
                          }))
                        }
                        placeholder="회사 또는 팀 이름"
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">직무</span>
                      <input
                        className="text-input"
                        type="text"
                        autoComplete="organization-title"
                        maxLength={120}
                        value={form.respondent.jobTitle}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            respondent: { ...current.respondent, jobTitle: event.target.value },
                          }))
                        }
                        placeholder="예: Product Designer"
                      />
                    </label>
                  </div>

                  <div className="consent-box">
                    <label className="consent-row">
                      <input
                        type="checkbox"
                        checked={form.privacyConsent}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, privacyConsent: event.target.checked }))
                        }
                        required
                      />
                      <span>
                        <b>[필수]</b> 결과 생성·저장과 입력한 이메일로 결과를 전송하기 위한 개인정보 수집·이용에
                        동의합니다. 보유 기간은 제출일로부터 1년입니다.{" "}
                        <Link href="/privacy" className="text-link" target="_blank" rel="noreferrer">
                          자세히 보기
                        </Link>
                      </span>
                    </label>
                    <label className="consent-row">
                      <input
                        type="checkbox"
                        checked={form.marketingConsent}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, marketingConsent: event.target.checked }))
                        }
                      />
                      <span>
                        <b>[선택]</b> HBKR 프로그램과 관련 소식의 이메일 수신 의사를 등록합니다. 실제 구독은 이메일
                        확인 후 완료됩니다.
                      </span>
                    </label>
                  </div>

                  <label className="honeypot" aria-hidden="true">
                    웹사이트
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                    />
                  </label>
                </>
              )}

              {step === 1 && (
                <>
                  <p className="step-kicker">01 · Domain</p>
                  <h2 className="step-title" ref={headingRef} tabIndex={-1}>
                    AI를 가장 자주 활용하는 분야는 무엇인가요?
                  </h2>
                  <p className="step-description">
                    전문성을 가진 분야를 모두 선택한 뒤, 현재를 가장 잘 설명하는 대표 Domain을 하나 지정하세요.
                  </p>

                  <div className="choice-grid">
                    {domains.map((domain) => {
                      const selected = form.domains.includes(domain.value);
                      return (
                        <label className={`choice-card${selected ? " selected" : ""}`} key={domain.value}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setForm((current) => {
                                const nextDomains = toggleValue(current.domains, domain.value);
                                return {
                                  ...current,
                                  domains: nextDomains,
                                  primaryDomain: nextDomains.includes(current.primaryDomain as DomainValue)
                                    ? current.primaryDomain
                                    : "",
                                };
                              })
                            }
                          />
                          <span>
                            <strong>{domain.label}</strong>
                            <small>{domain.description}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="section-block">
                    <label className="field">
                      <span className="field-label required">Primary Domain</span>
                      <select
                        className="select-input"
                        value={form.primaryDomain}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            primaryDomain: event.target.value as DomainValue | "",
                          }))
                        }
                        disabled={selectedDomains.length === 0}
                        required
                      >
                        <option value="">
                          {selectedDomains.length ? "대표 Domain 선택" : "먼저 Domain을 선택하세요"}
                        </option>
                        {selectedDomains.map((domain) => (
                          <option key={domain.value} value={domain.value}>
                            {domain.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="step-kicker">02 · AI Depth</p>
                  <h2 className="step-title" ref={headingRef} tabIndex={-1}>
                    실제 행동에 가장 가까운 정도를 표시하세요.
                  </h2>
                  <p className="step-description">
                    “나는 어느 레벨인가”를 묻지 않습니다. 최근의 업무와 프로젝트 경험을 기준으로 답해 주세요.
                  </p>
                  <div className="scale-caption">
                    <span>전혀 아니다 · 0</span>
                    <span>매우 그렇다 · 4</span>
                  </div>
                  <div className="question-list">
                    {depthQuestions.map((question, index) => (
                      <fieldset className="question-card" key={question.id}>
                        <legend>
                          <span className="question-number">{String(index + 1).padStart(2, "0")}</span>
                          {question.text}
                        </legend>
                        <div className="scale-row">
                          {[0, 1, 2, 3, 4].map((value) => (
                            <label
                              className={`scale-choice${form.depthAnswers[index] === value ? " selected" : ""}`}
                              key={value}
                            >
                              <input
                                type="radio"
                                name={`depth-${question.id}`}
                                value={value}
                                checked={form.depthAnswers[index] === value}
                                onChange={() =>
                                  setForm((current) => {
                                    const nextAnswers = [...current.depthAnswers];
                                    nextAnswers[index] = value;
                                    return { ...current, depthAnswers: nextAnswers };
                                  })
                                }
                                aria-label={
                                  value === 0
                                    ? "0점, 전혀 아니다"
                                    : value === 4
                                      ? "4점, 매우 그렇다"
                                      : `${value}점`
                                }
                              />
                              {value}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="step-kicker">03 · Role & Capability</p>
                  <h2 className="step-title" ref={headingRef} tabIndex={-1}>
                    AI와 일할 때 어떤 역할을 맡고 있나요?
                  </h2>
                  <p className="step-description">
                    실제로 수행하는 Role을 모두 고르고 대표 Role을 지정하세요. 직접 다뤄본 Capability도 함께 선택할 수
                    있습니다.
                  </p>

                  <section className="section-block" aria-labelledby="role-heading">
                    <div className="section-heading">
                      <h3 className="group-label required" id="role-heading">
                        수행 중인 Role
                      </h3>
                      <p>복수 선택 가능</p>
                    </div>
                    <div className="choice-grid">
                      {roles.map((role) => {
                        const selected = form.roles.includes(role.value);
                        return (
                          <label className={`choice-card${selected ? " selected" : ""}`} key={role.value}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setForm((current) => {
                                  const nextRoles = toggleValue(current.roles, role.value);
                                  return {
                                    ...current,
                                    roles: nextRoles,
                                    primaryRole: nextRoles.includes(current.primaryRole as RoleValue)
                                      ? current.primaryRole
                                      : "",
                                  };
                                })
                              }
                            />
                            <span>
                              <strong>{role.label}</strong>
                              <small>{role.description}</small>
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <label className="field section-block">
                      <span className="field-label required">Primary Role</span>
                      <select
                        className="select-input"
                        value={form.primaryRole}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            primaryRole: event.target.value as RoleValue | "",
                          }))
                        }
                        disabled={selectedRoles.length === 0}
                        required
                      >
                        <option value="">
                          {selectedRoles.length ? "대표 Role 선택" : "먼저 Role을 선택하세요"}
                        </option>
                        {selectedRoles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </section>

                  <section className="section-block" aria-labelledby="capability-heading">
                    <div className="section-heading">
                      <h3 className="group-label" id="capability-heading">
                        직접 사용·구성해 본 Capability
                      </h3>
                      <p>선택 사항</p>
                    </div>
                    <div className="choice-grid">
                      {capabilities.map((capability) => {
                        const selected = form.capabilities.includes(capability.value);
                        return (
                          <label className={`choice-card${selected ? " selected" : ""}`} key={capability.value}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setForm((current) => ({
                                  ...current,
                                  capabilities: toggleValue(current.capabilities, capability.value),
                                }))
                              }
                            />
                            <span>
                              <strong>{capability.label}</strong>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}

              {step === 4 && (
                <>
                  <p className="step-kicker">04 · Production Maturity</p>
                  <h2 className="step-title" ref={headingRef} tabIndex={-1}>
                    실제 적용 경험은 어디까지 이어졌나요?
                  </h2>
                  <p className="step-description">
                    기술 난이도와는 별개의 축입니다. 경험한 가장 높은 운영 수준 하나를 선택하면 결과가 서버에 안전하게
                    저장됩니다.
                  </p>

                  <div className="choice-grid">
                    {maturityLevels.map((maturity) => {
                      const selected = form.maturity === maturity.value;
                      return (
                        <label className={`choice-card${selected ? " selected" : ""}`} key={maturity.value}>
                          <input
                            type="radio"
                            name="maturity"
                            value={maturity.value}
                            checked={selected}
                            onChange={() =>
                              setForm((current) => ({ ...current, maturity: maturity.value }))
                            }
                          />
                          <span>
                            <strong>{maturity.label}</strong>
                            <small>{maturity.description}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}

              {stepError && (
                <p className={step === 4 ? "submit-error" : "step-error"} role="alert">
                  {stepError}
                </p>
              )}

              <div className="actions">
                {step > 0 ? (
                  <button
                    className="button secondary-button"
                    type="button"
                    onClick={() => moveToStep(step - 1)}
                    disabled={isSubmitting}
                  >
                    이전
                  </button>
                ) : (
                  <span aria-hidden="true" />
                )}
                <button className="button primary-button" type="submit" disabled={isSubmitting}>
                  {step === stepLabels.length - 1 ? (isSubmitting ? "저장 중…" : "결과 저장하고 보기") : "다음"}
                  {!isSubmitting && <span className="button-arrow">→</span>}
                </button>
              </div>
            </form>
          </section>
          <p className="footer-note">
            이 결과는 자기보고형 프로파일이며 자격이나 실무 능력을 외부 검증한 평가는 아닙니다.
          </p>
        </>
      ) : (
        <ResultView
          storedResult={storedResult}
          copyLabel={copyLabel}
          onCopy={copyResult}
          onDownload={downloadResult}
          onReset={resetSurvey}
        />
      )}
    </main>
  );
}

function ResultView({
  storedResult,
  copyLabel,
  onCopy,
  onDownload,
  onReset,
}: {
  storedResult: StoredResult;
  copyLabel: string;
  onCopy: () => void;
  onDownload: () => void;
  onReset: () => void;
}) {
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const { result, submissionId, submittedAt, emailDelivery } = storedResult;
  const domainLabel = labelFor(domains, result.primaryDomain);
  const roleLabel = labelFor(roles, result.primaryRole);
  const maturityLabel = labelFor(maturityLevels, result.maturity);
  const primaryDepth = depthLabels[result.primaryDepth];

  useEffect(() => {
    resultHeadingRef.current?.focus();
  }, []);

  return (
    <section className="result-card" aria-live="polite">
      <div className="result-header">
        <div>
          <p className="eyebrow">Your AI Positioning Profile</p>
          <h2 ref={resultHeadingRef} tabIndex={-1}>
            {domainLabel} × {primaryDepth.label}
          </h2>
          <p className="result-summary">
            {domainLabel} 분야에서 {primaryDepth.label} 역량이 가장 두드러지며, 주요 역할은 {roleLabel}입니다.
            현재 적용 경험은 {maturityLabel} 단계로 응답했습니다.
          </p>
          {emailDelivery === "scheduled" ? (
            <p className="result-email-note" role="status">
              입력한 이메일로 결과 발송을 요청했습니다. 도착하지 않으면 잠시 후 스팸함도 확인해 주세요.
            </p>
          ) : (
            <p className="result-email-note email-unavailable" role="status">
              결과는 저장됐지만 이메일 발송 기능은 현재 사용할 수 없습니다. 아래에서 결과를 저장해 주세요.
            </p>
          )}
        </div>
        <div className="submission-ticket">
          <span>Stored submission</span>
          <strong>{submissionId}</strong>
          <strong>{new Date(submittedAt).toLocaleString("ko-KR")}</strong>
        </div>
      </div>

      <div className="result-grid">
        <div className="metric-card">
          <div className="metric-label">Primary Domain</div>
          <div className="metric-value">{domainLabel}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Primary Role</div>
          <div className="metric-value">{roleLabel}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Production Maturity</div>
          <div className="metric-value">{maturityLabel}</div>
        </div>
      </div>

      <section className="result-section">
        <h3>AI Depth Shape</h3>
        <div className="bar-list">
          {Object.entries(result.depth).map(([key, value]) => (
            <div className="bar-row" key={key}>
              <span className="bar-label">{depthLabels[key as keyof typeof depthLabels].label}</span>
              <div className="bar-track" aria-label={`${key} ${value}점`}>
                <div className="bar-value" style={{ width: `${value}%` }} />
              </div>
              <span className="bar-score">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="result-section">
        <h3>Selected Capabilities</h3>
        <div className="pill-row">
          {result.capabilities.length ? (
            result.capabilities.map((capability) => (
              <span className="pill" key={capability}>
                {labelFor(capabilities, capability)}
              </span>
            ))
          ) : (
            <span className="pill">선택 없음</span>
          )}
        </div>
      </section>

      <p className="result-disclaimer">
        이 결과는 자기보고형 프로파일입니다. 사람을 서열화하는 점수나 외부 검증형 자격이 아니며, 자신의 AI 활용 위치를
        설명 가능한 구조로 만드는 데 목적이 있습니다.
      </p>

      <div className="result-actions">
        <button className="button secondary-button" type="button" onClick={onReset}>
          다시 작성
        </button>
        <div className="result-action-group">
          <button className="button secondary-button" type="button" onClick={onCopy}>
            {copyLabel}
          </button>
          <button className="button primary-button" type="button" onClick={onDownload}>
            JSON 저장
          </button>
        </div>
      </div>
    </section>
  );
}
