'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
} from 'react';
import { flushSync } from 'react-dom';

import { submitIntake } from '@/app/actions';
import { SelectField, TextareaField, TextField } from '@/components/form-field';
import { launch } from '@/content/launch';
import { cn } from '@/lib/cn';
import {
  firstInvalidField,
  intakeFields,
  intakeLimits,
  isIntakeField,
  readIntake,
  validateIntake,
  validateIntakeField,
  type IntakeErrors,
  type IntakeField,
  type IntakeState,
} from '@/lib/intake';

const copy = launch.intake;
const fields = copy.fields;
const initialState: IntakeState = { status: 'idle' };

/**
 * The Séance intake form. Validates in the browser for fast feedback, re-validates in
 * the `submitIntake` server action, and swaps to a confirmation when it lands.
 *
 * Validation timing: an empty field you tab past is left alone. A field is checked
 * when you leave it after typing, and every field is checked on submit. Once a field
 * shows an error, it re-checks as you type so the error clears the moment it's fixed.
 */
export function IntakeForm() {
  // Bumping the key remounts the form — the simplest way to fully start over.
  const [round, setRound] = useState(0);
  return <IntakeFormBody key={round} onStartOver={() => setRound((n) => n + 1)} />;
}

function IntakeFormBody({ onStartOver }: { onStartOver: () => void }) {
  const [state, formAction, pending] = useActionState(submitIntake, initialState);
  // Client-side results since the last submit. A field set to `undefined` means
  // "checked and fine", which also hides a stale server error for that field.
  const [clientErrors, setClientErrors] = useState<IntakeErrors>({});
  const [attempted, setAttempted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const serverErrors = state.status === 'invalid' ? state.errors : {};
  const errors: IntakeErrors = { ...serverErrors, ...clientErrors };
  // Without JS (or if client and server ever disagree) the server echoes values back.
  const values = state.status === 'invalid' ? state.values : undefined;

  // After the server answers, move focus to the first bad field or the confirmation.
  useEffect(() => {
    if (state.status === 'invalid') focusField(formRef.current, firstInvalidField(state.errors));
    if (state.status === 'success') successHeadingRef.current?.focus();
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }

    const form = event.currentTarget;
    const found = validateIntake(readIntake(new FormData(form)));
    // Record every field, so fixed fields drop any old server error too.
    const checked = Object.fromEntries(intakeFields.map((f) => [f, found[f]])) as IntakeErrors;
    const first = firstInvalidField(found);

    if (first) {
      // Cancelling the submit event stops React from calling the server action.
      event.preventDefault();
      // Render the errors before moving focus, so screen readers hear the invalid state.
      flushSync(() => {
        setAttempted(true);
        setClientErrors(checked);
      });
      focusField(form, first);
      return;
    }

    setAttempted(true);
    setClientErrors({});
  }

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    const target = event.target;
    if (!isFieldElement(target) || !isIntakeField(target.name)) return;
    if (!attempted && target.value.trim() === '') return;
    recheck(target.name, target.value);
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!isFieldElement(target) || !isIntakeField(target.name)) return;
    if (!errors[target.name]) return;
    recheck(target.name, target.value);
  }

  function recheck(field: IntakeField, value: string) {
    setClientErrors((prev) => ({ ...prev, [field]: validateIntakeField(field, value) }));
  }

  if (state.status === 'success') {
    const firstName = state.name.split(/\s+/)[0];
    return (
      <div className="flex flex-col items-start gap-6 motion-safe:animate-rise">
        <span className="grid size-12 place-items-center bg-pumpkin-500 text-black">
          <PixelCheck />
        </span>
        <div className="flex flex-col gap-3">
          <h3
            ref={successHeadingRef}
            tabIndex={-1}
            className="font-display text-3xl text-fg0 outline-none"
          >
            {copy.success.headline}
          </h3>
          <p className="text-lg text-fg2">
            Thanks, {firstName}. {copy.success.body}
          </p>
          <p className="font-mono text-xs text-fg3">
            Replying to <span className="text-fg1">{state.email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onStartOver}
          className="font-mono text-xs text-fg3 uppercase underline-offset-4 hover:text-fg1 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fgAccent1"
        >
          {copy.success.again}
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      onBlur={handleBlur}
      onChange={handleChange}
      noValidate
      className="flex flex-col gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="name"
          label={fields.name.label}
          placeholder={fields.name.placeholder}
          autoComplete="name"
          maxLength={intakeLimits.name}
          defaultValue={values?.name}
          error={errors.name}
        />
        <TextField
          name="email"
          type="email"
          label={fields.email.label}
          placeholder={fields.email.placeholder}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={intakeLimits.email}
          defaultValue={values?.email}
          error={errors.email}
        />
        <TextField
          name="company"
          label={fields.company.label}
          placeholder={fields.company.placeholder}
          autoComplete="organization"
          maxLength={intakeLimits.company}
          defaultValue={values?.company}
          error={errors.company}
        />
        <SelectField
          name="industry"
          label={fields.industry.label}
          placeholder={fields.industry.placeholder}
          defaultValue={values?.industry || undefined}
          error={errors.industry}
        >
          {copy.industries.map((industry) => (
            <option key={industry.value} value={industry.value}>
              {industry.label}
            </option>
          ))}
        </SelectField>
      </div>

      <TextareaField
        name="referral"
        label={fields.referral.label}
        placeholder={fields.referral.placeholder}
        rows={3}
        maxLength={intakeLimits.referral}
        defaultValue={values?.referral}
        error={errors.referral}
      />

      <TextareaField
        name="useCase"
        optional
        label={fields.useCase.label}
        placeholder={fields.useCase.placeholder}
        hint={fields.useCase.hint}
        rows={4}
        maxLength={intakeLimits.useCase}
        defaultValue={values?.useCase}
        error={errors.useCase}
      />

      <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg3">{copy.privacyNote}</p>
        <SubmitButton pending={pending} />
      </div>

      <p role="status" className="sr-only">
        {pending ? copy.pendingLabel : ''}
      </p>
    </form>
  );
}

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      // aria-disabled (not disabled) keeps focus on the button while the request runs.
      aria-disabled={pending || undefined}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center bg-pumpkin-500 px-5 font-medium text-black sm:w-auto',
        'transition-[background-color,translate] duration-150 motion-reduce:transition-none',
        'hover:bg-pumpkin-400 active:translate-y-px active:bg-pumpkin-600',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fgAccent1',
        'aria-disabled:cursor-progress aria-disabled:hover:bg-pumpkin-500 aria-disabled:active:translate-y-0',
      )}
    >
      {/* Both labels share one grid cell so the button never changes width. */}
      <span className="grid">
        <span className={cn('col-start-1 row-start-1', pending && 'invisible')}>
          {copy.submitLabel}
        </span>
        <span
          className={cn(
            'col-start-1 row-start-1 inline-flex items-center justify-center gap-2.5',
            !pending && 'invisible',
          )}
        >
          <PixelLoader />
          {copy.pendingLabel}
        </span>
      </span>
    </button>
  );
}

/* Helpers ---------------------------------------------------------------------------------- */

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isFieldElement(target: EventTarget | null): target is FieldElement {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

function focusField(form: HTMLFormElement | null, field: IntakeField | undefined) {
  if (!form || !field) return;
  const element = form.elements.namedItem(field);
  if (element instanceof HTMLElement) element.focus();
}

/* Pixel glyphs ----------------------------------------------------------------------------- */

function PixelLoader() {
  return (
    <span aria-hidden className="inline-flex gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 bg-current motion-safe:animate-pixel-blink"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

function PixelCheck() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 10"
      width={21}
      height={15}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <path d="M0 4h2v2H0zM2 6h2v2H2zM4 8h2v2H4zM6 6h2v2H6zM8 4h2v2H8zM10 2h2v2h-2zM12 0h2v2h-2z" />
    </svg>
  );
}
