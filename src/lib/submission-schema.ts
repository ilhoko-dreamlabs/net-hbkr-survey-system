import { z } from "zod";

import {
  capabilities,
  depthQuestions,
  domains,
  maturityLevels,
  roles,
  type CapabilityValue,
  type DomainValue,
  type MaturityValue,
  type RoleValue,
} from "./survey-data";

const controlCharacterPattern = /[\u0000-\u001f\u007f]/u;

const domainValueSchema = z.enum(
  domains.map(({ value }) => value) as [DomainValue, ...DomainValue[]],
);
const roleValueSchema = z.enum(
  roles.map(({ value }) => value) as [RoleValue, ...RoleValue[]],
);
const capabilityValueSchema = z.enum(
  capabilities.map(({ value }) => value) as [
    CapabilityValue,
    ...CapabilityValue[],
  ],
);
const maturityValueSchema = z.enum(
  maturityLevels.map(({ value }) => value) as [
    MaturityValue,
    ...MaturityValue[],
  ],
);

function requiredText(label: string, maximumLength: number) {
  return z
    .string()
    .transform((value) => value.normalize("NFKC").trim())
    .pipe(
      z
        .string()
        .min(1, `${label}을(를) 입력해 주세요.`)
        .max(maximumLength, `${label}은(는) ${maximumLength}자 이하여야 합니다.`)
        .refine(
          (value) => !controlCharacterPattern.test(value),
          `${label}에 사용할 수 없는 문자가 포함되어 있습니다.`,
        ),
    );
}

function optionalText(label: string, maximumLength: number) {
  return z
    .string()
    .transform((value) => value.normalize("NFKC").trim())
    .pipe(
      z
        .string()
        .max(maximumLength, `${label}은(는) ${maximumLength}자 이하여야 합니다.`)
        .refine(
          (value) => !controlCharacterPattern.test(value),
          `${label}에 사용할 수 없는 문자가 포함되어 있습니다.`,
        ),
    )
    .optional();
}

const emailSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(3, "올바른 이메일을 입력해 주세요.")
      .max(254, "이메일은 254자 이하여야 합니다.")
      .email("올바른 이메일을 입력해 주세요."),
  );

const depthAnswerSchema = z.number().int().min(0).max(4);

export const surveySubmissionSchema = z
  .object({
    respondent: z
      .object({
        name: requiredText("이름", 80),
        email: emailSchema,
        organization: optionalText("소속", 120),
        jobTitle: optionalText("직책", 120),
      })
      .strict(),
    domains: z
      .array(domainValueSchema)
      .min(1, "Domain을 하나 이상 선택해 주세요.")
      .max(domains.length)
      .refine(
        (values) => new Set(values).size === values.length,
        "Domain 선택에 중복 값이 있습니다.",
      ),
    primaryDomain: domainValueSchema,
    depthAnswers: z
      .array(depthAnswerSchema)
      .length(
        depthQuestions.length,
        `AI Depth ${depthQuestions.length}개 문항에 모두 응답해 주세요.`,
      ),
    roles: z
      .array(roleValueSchema)
      .min(1, "Role을 하나 이상 선택해 주세요.")
      .max(roles.length)
      .refine(
        (values) => new Set(values).size === values.length,
        "Role 선택에 중복 값이 있습니다.",
      ),
    primaryRole: roleValueSchema,
    capabilities: z
      .array(capabilityValueSchema)
      .max(capabilities.length)
      .refine(
        (values) => new Set(values).size === values.length,
        "Capability 선택에 중복 값이 있습니다.",
      ),
    maturity: maturityValueSchema,
    privacyConsent: z.literal(true),
    marketingConsent: z.boolean(),
    privacyVersion: z.literal("2026-08-14"),
    website: z.string().max(200).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.domains.includes(value.primaryDomain)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primaryDomain"],
        message: "Primary Domain은 선택한 Domain 중 하나여야 합니다.",
      });
    }

    if (!value.roles.includes(value.primaryRole)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primaryRole"],
        message: "Primary Role은 선택한 Role 중 하나여야 합니다.",
      });
    }
  });

export type SurveySubmissionInput = z.input<typeof surveySubmissionSchema>;
