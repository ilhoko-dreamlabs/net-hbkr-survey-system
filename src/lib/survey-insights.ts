import {
  depthLabels,
  domains,
  maturityLevels,
  roles,
  type DepthKey,
  type MaturityValue,
  type RoleValue,
  type SurveyResult,
} from "./survey-data";

export type SurveyInsight = {
  archetype: string;
  tagline: string;
  signal: string;
  growthEdge: string;
  actions: readonly [string, string, string];
  strongestDepth: DepthKey;
  secondaryDepth: DepthKey;
};

const depthFlavors: Record<DepthKey, string> = {
  use: "도구 감각형",
  workflow: "프로세스 설계형",
  integrate: "연결 확장형",
  build: "제품 구현형",
  core: "코어 탐구형",
};

const rolePersonas: Record<RoleValue, string> = {
  creator: "AI 크리에이티브 디렉터",
  operator: "AI 실전 파일럿",
  orchestrator: "AI 워크플로 지휘자",
  integrator: "AI 시스템 커넥터",
  builder: "AI 프로덕트 메이커",
  architect: "AI 솔루션 아키텍트",
  researcher: "AI 실험 탐험가",
  educator: "AI 러닝 가이드",
  consultant: "AI 기회 설계자",
};

const depthNextMoves: Record<DepthKey, string> = {
  use: "자주 쓰는 작업 하나를 골라 프롬프트·참조자료·검수 기준을 템플릿으로 만드세요.",
  workflow: "현재 흐름에서 가장 느린 한 단계를 골라 자동화하고, 실패했을 때 사람이 개입하는 지점을 정하세요.",
  integrate: "연결된 데이터의 권한·실패 처리·로그를 점검해 데모가 아닌 운영 가능한 흐름으로 바꾸세요.",
  build: "정확도·비용·지연시간 중 핵심 지표 하나를 정하고 실제 사용 로그로 평가 루프를 만드세요.",
  core: "모델·인프라 개선이 실제 사용자 경험에 주는 효과를 하나의 제품 지표와 연결해 검증하세요.",
};

const maturityMoves: Record<MaturityValue, string> = {
  explore: "이번 주 안에 해결할 실제 업무 한 가지와 ‘성공한 결과’의 기준을 한 문장으로 정하세요.",
  prototype: "시제품을 3번 반복 실행해 품질 편차와 실패 사례를 기록하고 다음 버전의 우선순위를 정하세요.",
  repeatable: "반복 가능한 과정을 체크리스트로 만들고 다른 한 사람도 같은 품질을 낼 수 있는지 확인하세요.",
  production: "운영 중인 흐름에 품질·비용·권한을 함께 보는 월간 점검표를 붙이세요.",
  scaled: "팀별 활용 편차와 예외 상황을 관측해 공통 가드레일과 재사용 가능한 패턴으로 정리하세요.",
};

const roleMoves: Record<RoleValue, string> = {
  creator: "좋은 결과물뿐 아니라 재현 가능한 제작 레시피 한 개를 팀에 공유하세요.",
  operator: "반복 업무 전후의 시간과 수정 횟수를 기록해 AI 활용 효과를 숫자로 확인하세요.",
  orchestrator: "도구·사람·승인 지점을 한 장의 흐름도로 그리고 병목 하나를 제거하세요.",
  integrator: "가장 중요한 연동 하나에 입력 검증과 장애 알림을 추가하세요.",
  builder: "핵심 사용자 3명에게 현재 기능을 보여주고 가장 자주 막히는 순간을 수집하세요.",
  architect: "현재 구조의 비용·보안·확장성 가정을 짧은 의사결정 기록으로 남기세요.",
  researcher: "실험 하나에 기준선과 성공 조건을 먼저 정해 비교 가능한 결과를 만드세요.",
  educator: "학습자가 직접 해보는 15분짜리 실습과 전후 체크 질문을 만드세요.",
  consultant: "제안하는 AI 적용안에 기대효과와 함께 적용하지 말아야 할 조건도 명시하세요.",
};

function labelFor<T extends string>(items: readonly { value: T; label: string }[], value: T) {
  return items.find((item) => item.value === value)?.label ?? value;
}

export function buildSurveyInsight(result: SurveyResult): SurveyInsight {
  const rankedDepths = (Object.entries(result.depth) as [DepthKey, number][]).sort(
    ([, left], [, right]) => right - left,
  );
  const [[strongestDepth, strongestScore], [secondaryDepth, secondaryScore]] = rankedDepths;
  const domainLabel = labelFor(domains, result.primaryDomain);
  const roleLabel = labelFor(roles, result.primaryRole);
  const maturityLabel = labelFor(maturityLevels, result.maturity);
  const spread = strongestScore - rankedDepths.at(-1)![1];

  const signal =
    strongestScore === 0
      ? "아직 특정 Depth가 두드러지지 않았습니다. 지금은 작은 실제 과제로 자신에게 맞는 활용 방식을 발견할 시점입니다."
      : spread <= 12
        ? `${depthLabels[strongestDepth].label}와 ${depthLabels[secondaryDepth].label}를 포함한 역량이 고르게 나타납니다. 한 축을 더 선명하게 선택하면 강점이 빠르게 드러납니다.`
        : `${depthLabels[strongestDepth].label} ${strongestScore}점이 가장 강하고, ${depthLabels[secondaryDepth].label} ${secondaryScore}점이 뒤를 잇습니다. 넓게 확장하기보다 이 조합을 실제 성과로 연결할 때입니다.`;

  return {
    archetype: `${depthFlavors[strongestDepth]} ${rolePersonas[result.primaryRole]}`,
    tagline: `${domainLabel}에서 ${roleLabel}의 방식으로 움직이는 ${maturityLabel} 단계의 프로필입니다.`,
    signal,
    growthEdge: depthNextMoves[strongestDepth],
    actions: [
      maturityMoves[result.maturity],
      depthNextMoves[strongestDepth],
      roleMoves[result.primaryRole],
    ],
    strongestDepth,
    secondaryDepth,
  };
}
