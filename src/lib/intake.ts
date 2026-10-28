import { launch } from '@/content/launch';

/**
 * Séance intake: field names, limits, and validation rules.
 *
 * Shared by the client (instant feedback) and the server action (source of truth),
 * so the two can never disagree about what "valid" means.
 */

export const intakeFields = [
  'name',
  'email',
  'company',
  'industry',
  'referral',
  'useCase',
] as const;

export type IntakeField = (typeof intakeFields)[number];
export type IntakeValues = Record<IntakeField, string>;
export type IntakeErrors = Partial<Record<IntakeField, string>>;

export type IntakeState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: IntakeErrors; values: IntakeValues }
  | { status: 'success'; name: string; email: string };

/** Max characters per field. Enforced by `maxLength` in the UI and re-checked on the server. */
export const intakeLimits: Record<IntakeField, number> = {
  name: 120,
  email: 254,
  company: 120,
  industry: 64,
  referral: 500,
  useCase: 1000,
};

const industryValues = new Set<string>(launch.intake.industries.map((i) => i.value));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isIntakeField(name: string): name is IntakeField {
  return (intakeFields as readonly string[]).includes(name);
}

export function readIntake(formData: FormData): IntakeValues {
  const read = (field: IntakeField) => {
    const value = formData.get(field);
    return typeof value === 'string' ? value.trim() : '';
  };
  return {
    name: read('name'),
    email: read('email'),
    company: read('company'),
    industry: read('industry'),
    referral: read('referral'),
    useCase: read('useCase'),
  };
}

/** Returns an error message for one field, or `undefined` if it's valid. */
export function validateIntakeField(field: IntakeField, raw: string): string | undefined {
  const value = raw.trim();

  switch (field) {
    case 'name':
      if (!value) return 'Enter your name.';
      break;
    case 'email':
      if (!value) return 'Enter your work email.';
      if (!emailPattern.test(value)) return 'Enter an email like name@company.com.';
      break;
    case 'company':
      if (!value) return 'Enter your company name.';
      break;
    case 'industry':
      if (!industryValues.has(value)) return 'Choose an industry.';
      break;
    case 'referral':
      if (!value) return 'Tell us how you heard about Séance.';
      break;
    case 'useCase':
      break; // optional
  }

  if (value.length > intakeLimits[field]) {
    return `Keep this under ${intakeLimits[field]} characters.`;
  }
}

export function validateIntake(values: IntakeValues): IntakeErrors {
  const errors: IntakeErrors = {};
  for (const field of intakeFields) {
    const error = validateIntakeField(field, values[field]);
    if (error) errors[field] = error;
  }
  return errors;
}

export function firstInvalidField(errors: IntakeErrors): IntakeField | undefined {
  return intakeFields.find((field) => errors[field]);
}
