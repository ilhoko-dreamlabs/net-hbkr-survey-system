export const domains = [
  {
    value: "software",
    label: "Software / Development",
    description: "개발, 제품, 시스템, 자동화",
  },
  {
    value: "video",
    label: "Video / Film",
    description: "영상 제작, 연출, 편집, 생성형 영상",
  },
  {
    value: "design",
    label: "Design / Image",
    description: "디자인, 이미지, 브랜딩, 시각 작업",
  },
  {
    value: "audio",
    label: "Music / Audio",
    description: "음악, 음성, 사운드, 오디오 제작",
  },
  {
    value: "marketing",
    label: "Marketing / Content",
    description: "마케팅, 콘텐츠, 광고, 캠페인",
  },
  {
    value: "sales",
    label: "Sales",
    description: "영업, 제안, CRM, Lead 관리",
  },
  {
    value: "education",
    label: "Education",
    description: "교육, 강의, 학습 콘텐츠, 튜터링",
  },
  {
    value: "research",
    label: "Research",
    description: "리서치, 분석, 지식 탐색",
  },
  {
    value: "legal",
    label: "Legal",
    description: "법률, 계약, 규정, 문서 검토",
  },
  {
    value: "finance",
    label: "Finance / Accounting",
    description: "재무, 회계, 경영 분석",
  },
  {
    value: "manufacturing",
    label: "Manufacturing",
    description: "제조, 생산, 현장 운영",
  },
  {
    value: "healthcare",
    label: "Healthcare",
    description: "의료, 헬스케어, 임상 지원",
  },
  {
    value: "other",
    label: "Other Domain",
    description: "기타 전문 분야",
  },
] as const;

export const depthLabels = {
  use: {
    label: "Use",
    description: "개별 AI 도구를 업무에 활용",
  },
  workflow: {
    label: "Workflow",
    description: "여러 AI 도구를 조합해 반복 가능한 작업 흐름 구성",
  },
  integrate: {
    label: "Integrate",
    description: "AI를 외부 시스템·데이터·자동화와 연결",
  },
  build: {
    label: "Build",
    description: "Agent / AI Application / AI 기능을 직접 구축",
  },
  core: {
    label: "Core AI",
    description: "Model / Training / Serving / Infra 자체를 개발",
  },
} as const;

export const depthQuestions = [
  {
    id: "tool-selection",
    text: "필요한 업무에 맞는 AI 도구를 스스로 찾아 선택해 사용한다.",
    weights: { use: 1, workflow: 0.25 },
  },
  {
    id: "multi-tool",
    text: "한 가지 결과물을 만들기 위해 서로 다른 AI 도구를 두 개 이상 조합한다.",
    weights: { use: 0.25, workflow: 1 },
  },
  {
    id: "repeatable-process",
    text: "좋은 결과를 반복하기 위해 Prompt, Reference, Template, 절차 등을 정리해 둔다.",
    weights: { workflow: 1 },
  },
  {
    id: "quality-control",
    text: "AI 결과물을 검수하고 실패 원인을 판단해 과정 일부를 수정하는 기준이 있다.",
    weights: { workflow: 1 },
  },
  {
    id: "automation",
    text: "AI 작업을 Make, Zapier, n8n, Script 등으로 자동화한 경험이 있다.",
    weights: { integrate: 1, workflow: 0.25 },
  },
  {
    id: "external-systems",
    text: "AI를 Database, Drive, CRM, 업무 시스템 또는 외부 API와 연결해 사용한 경험이 있다.",
    weights: { integrate: 1 },
  },
  {
    id: "api-sdk",
    text: "API 또는 SDK를 이용해 AI 기능을 직접 구현한 경험이 있다.",
    weights: { build: 0.8, integrate: 0.4 },
  },
  {
    id: "agent-application",
    text: "RAG, MCP/Tool-use, Agent 또는 AI Application을 직접 설계·구축한 경험이 있다.",
    weights: { build: 1, integrate: 0.25 },
  },
  {
    id: "operations",
    text: "AI 시스템의 Evaluation, Observability, 권한, 운영 구조까지 다뤄본 경험이 있다.",
    weights: { build: 0.7, integrate: 0.6 },
  },
  {
    id: "model-infrastructure",
    text: "Model fine-tuning, training, serving, inference 최적화 또는 AI infra를 직접 다뤄본 경험이 있다.",
    weights: { core: 1, build: 0.25 },
  },
] as const;

export const roles = [
  {
    value: "creator",
    label: "Creator",
    description: "AI를 이용해 최종 결과물을 직접 만든다",
  },
  {
    value: "operator",
    label: "Operator",
    description: "AI를 실제 업무 수행에 지속적으로 사용한다",
  },
  {
    value: "orchestrator",
    label: "Orchestrator",
    description: "여러 도구·사람·작업 순서를 설계하고 조정한다",
  },
  {
    value: "integrator",
    label: "Integrator",
    description: "AI와 외부 시스템·데이터를 연결한다",
  },
  {
    value: "builder",
    label: "Builder",
    description: "Agent, AI 기능, Application을 직접 만든다",
  },
  {
    value: "architect",
    label: "Architect",
    description: "AI 적용 구조와 기술 Architecture를 설계한다",
  },
  {
    value: "researcher",
    label: "Researcher",
    description: "모델·도구·방법을 실험하고 비교한다",
  },
  {
    value: "educator",
    label: "Educator",
    description: "다른 사람이 AI를 활용하도록 교육한다",
  },
  {
    value: "consultant",
    label: "Consultant",
    description: "문제를 진단하고 AI 적용 방식을 제안한다",
  },
] as const;

export const capabilities = [
  { value: "text", label: "Text / LLM" },
  { value: "image", label: "Image Generation" },
  { value: "video", label: "Video Generation" },
  { value: "audio", label: "Audio / Voice" },
  { value: "prompt", label: "Prompt / Reference Design" },
  { value: "workflow", label: "Workflow Design" },
  { value: "automation", label: "Automation" },
  { value: "api", label: "API / SDK" },
  { value: "rag", label: "RAG / Knowledge" },
  { value: "mcp", label: "MCP / Tool-use" },
  { value: "agent", label: "Agent" },
  { value: "multiagent", label: "Multi-Agent" },
  { value: "eval", label: "Evaluation / Observability" },
  { value: "finetune", label: "Fine-tuning" },
  { value: "serving", label: "Model Serving / Infra" },
] as const;

export const maturityLevels = [
  {
    value: "explore",
    label: "Explore",
    description: "개인적으로 AI 도구를 실험하고 익히는 단계",
  },
  {
    value: "prototype",
    label: "Prototype",
    description: "AI를 이용해 하나의 완성된 결과물 또는 시제품을 만들어 본 단계",
  },
  {
    value: "repeatable",
    label: "Repeatable",
    description: "같은 유형의 작업을 일정 품질로 반복할 수 있는 단계",
  },
  {
    value: "production",
    label: "Production",
    description: "실제 고객·회사·업무 환경에서 지속적으로 사용하는 단계",
  },
  {
    value: "scaled",
    label: "Scaled",
    description: "여러 사람·팀 또는 지속 운영 환경으로 확장한 단계",
  },
] as const;

export type DomainValue = (typeof domains)[number]["value"];
export type DepthKey = keyof typeof depthLabels;
export type RoleValue = (typeof roles)[number]["value"];
export type CapabilityValue = (typeof capabilities)[number]["value"];
export type MaturityValue = (typeof maturityLevels)[number]["value"];

export type SurveyRawAnswers = {
  domains: DomainValue[];
  primaryDomain: DomainValue;
  depthAnswers: number[];
  roles: RoleValue[];
  primaryRole: RoleValue;
  capabilities: CapabilityValue[];
  maturity: MaturityValue;
};

export type SurveyResult = {
  version: "1.0";
  primaryDomain: DomainValue;
  domains: DomainValue[];
  depth: Record<DepthKey, number>;
  primaryDepth: DepthKey;
  roles: RoleValue[];
  primaryRole: RoleValue;
  maturity: MaturityValue;
  capabilities: CapabilityValue[];
};

type SurveyResultInput = {
  domains: readonly DomainValue[];
  primaryDomain: DomainValue;
  depthAnswers: readonly number[];
  roles: readonly RoleValue[];
  primaryRole: RoleValue;
  capabilities: readonly CapabilityValue[];
  maturity: MaturityValue;
};

const depthKeys = Object.keys(depthLabels) as DepthKey[];

export function calculateDepth(answers: number[]): Record<DepthKey, number> {
  if (
    answers.length !== depthQuestions.length ||
    answers.some(
      (answer) => !Number.isInteger(answer) || answer < 0 || answer > 4,
    )
  ) {
    throw new RangeError(
      `Depth answers must contain exactly ${depthQuestions.length} integers between 0 and 4.`,
    );
  }

  const sums: Record<DepthKey, number> = {
    use: 0,
    workflow: 0,
    integrate: 0,
    build: 0,
    core: 0,
  };
  const maximums: Record<DepthKey, number> = {
    use: 0,
    workflow: 0,
    integrate: 0,
    build: 0,
    core: 0,
  };

  depthQuestions.forEach((question, index) => {
    const answer = answers[index];
    const weights = question.weights as Partial<Record<DepthKey, number>>;

    for (const key of depthKeys) {
      const weight = weights[key];
      if (weight === undefined) continue;

      sums[key] += answer * weight;
      maximums[key] += 4 * weight;
    }
  });

  return Object.fromEntries(
    depthKeys.map((key) => [
      key,
      Math.round((sums[key] / maximums[key]) * 100),
    ]),
  ) as Record<DepthKey, number>;
}

export function buildSurveyResult(input: SurveyResultInput): SurveyResult {
  const depth = calculateDepth([...input.depthAnswers]);
  const primaryDepth = depthKeys.reduce((strongest, current) =>
    depth[current] > depth[strongest] ? current : strongest,
  );

  return {
    version: "1.0",
    primaryDomain: input.primaryDomain,
    domains: [...input.domains],
    depth,
    primaryDepth,
    roles: [...input.roles],
    primaryRole: input.primaryRole,
    maturity: input.maturity,
    capabilities: [...input.capabilities],
  };
}
