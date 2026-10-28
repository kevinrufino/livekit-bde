'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import { submitIntake } from '@/app/actions';
import {
  DitherChoice,
  DitherInput,
  DitherSurface,
  DitherTextarea,
} from '@/components/dither-field';
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
const questions = copy.fields;
const initialState: IntakeState = { status: 'idle' };
const lastStep = intakeFields.length - 1;
const optionalFields: ReadonlySet<IntakeField> = new Set(['useCase']);
const multiline: ReadonlySet<IntakeField> = new Set(['referral', 'useCase']);

/**
 * The Séance intake as a short conversation: one question per step.
 *
 * Every field stays mounted (later steps are just hidden), so the final submit sends
 * the whole form to the `submitIntake` server action, which re-validates it all.
 * Continue checks only the current question; the last step checks everything and
 * jumps back to anything that's wrong.
 */
export function IntakeForm() {
  // Bumping the key remounts the form — the simplest way to fully start over.
  const [round, setRound] = useState(0);
  return <IntakeFormBody key={round} onStartOver={() => setRound((n) => n + 1)} />;
}

function IntakeFormBody({ onStartOver }: { onStartOver: () => void }) {
  const [state, formAction, pending] = useActionState(submitIntake, initialState);
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState('');
  // Client-side results. A field set to `undefined` means "checked and fine", which
  // also hides a stale server error for that field.
  const [clientErrors, setClientErrors] = useState<IntakeErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusOnStepChange = useRef(false);

  // When the server sends errors back, jump to the first question that needs work.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    const first = state.status === 'invalid' ? firstInvalidField(state.errors) : undefined;
    if (first) setStep(intakeFields.indexOf(first));
  }

  const serverErrors = state.status === 'invalid' ? state.errors : {};
  const errors: IntakeErrors = { ...serverErrors, ...clientErrors };
  const values = state.status === 'invalid' ? state.values : undefined;
  const field = intakeFields[step];

  useEffect(() => {
    if (!focusOnStepChange.current) return;
    focusOnStepChange.current = false;
    focusField(formRef.current, intakeFields[step]);
  }, [step]);

  useEffect(() => {
    if (state.status === 'invalid') focusField(formRef.current, firstInvalidField(state.errors));
    if (state.status === 'success') successHeadingRef.current?.focus();
  }, [state]);

  function goTo(next: number) {
    focusOnStepChange.current = true;
    setStep(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }
    const form = event.currentTarget;
    const values = readIntake(new FormData(form));

    if (step < lastStep) {
      // Not the end yet: check this question, then move on.
      event.preventDefault();
      const error = validateIntakeField(field, values[field]);
      setClientErrors((prev) => ({ ...prev, [field]: error }));
      if (error) focusField(form, field);
      else goTo(step + 1);
      return;
    }

    const found = validateIntake(values);
    const first = firstInvalidField(found);
    setClientErrors(Object.fromEntries(intakeFields.map((f) => [f, found[f]])) as IntakeErrors);
    if (first) {
      // Cancelling the submit stops React from calling the server action.
      event.preventDefault();
      goTo(intakeFields.indexOf(first));
    }
  }

  // Once a question shows an error, re-check as they answer so it clears when fixed.
  function handleChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!isFieldElement(target) || !isIntakeField(target.name)) return;
    if (!errors[target.name]) return;
    const name = target.name;
    setClientErrors((prev) => ({ ...prev, [name]: validateIntakeField(name, target.value) }));
  }

  // Enter continues from a choice; Ctrl/⌘+Enter continues from a text area.
  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter') return;
    const target = event.target;
    const isRadio = target instanceof HTMLInputElement && target.type === 'radio';
    const isTextarea = target instanceof HTMLTextAreaElement;
    if (isRadio || (isTextarea && (event.metaKey || event.ctrlKey))) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
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

  const isLast = step === lastStep;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      noValidate
      className="flex flex-col gap-8"
    >
      {/* Progress */}
      <div className="flex items-center justify-between gap-6">
        <p
          className="shrink-0 font-mono text-xs whitespace-nowrap text-fg3 uppercase"
          aria-live="polite"
        >
          {copy.controls.step(step + 1, intakeFields.length)}
        </p>
        <div aria-hidden className="flex w-full max-w-56 gap-1">
          {intakeFields.map((f, i) => (
            <span key={f} className="relative h-2 flex-1">
              <DitherSurface tone={i < step ? 'progress' : i === step ? 'focus' : 'idle'} />
            </span>
          ))}
        </div>
      </div>

      {/* Questions — all mounted, one shown */}
      <div className="min-h-56">
        {intakeFields.map((f, i) => (
          <div key={f} hidden={i !== step} className="motion-safe:animate-step-in">
            <Question
              field={f}
              error={errors[f]}
              defaultValue={values?.[f]}
              industry={industry}
              onIndustry={setIndustry}
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 border-t pt-6">
        <button
          type="button"
          onClick={() => goTo(step - 1)}
          className={cn(
            'font-mono text-xs text-fg3 uppercase hover:text-fg1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fgAccent1',
            step === 0 && 'invisible',
          )}
        >
          ← {copy.controls.back}
        </button>
        <div className="flex items-center gap-4">
          <span aria-hidden className="hidden font-mono text-xs text-fg3 sm:inline">
            {multiline.has(field) ? copy.controls.enterMultiline : copy.controls.enter}
          </span>
          <SubmitButton pending={pending} label={isLast ? copy.submitLabel : copy.controls.next} />
        </div>
      </div>

      <p role="status" className="sr-only">
        {pending ? copy.pendingLabel : ''}
      </p>
    </form>
  );
}

/* One question ------------------------------------------------------------------------------ */

type QuestionProps = {
  field: IntakeField;
  error?: string;
  defaultValue?: string;
  industry: string;
  onIndustry: (value: string) => void;
};

function Question({ field, error, defaultValue, industry, onIndustry }: QuestionProps) {
  const id = `intake-${field}`;
  const q = questions[field];
  const hint = 'hint' in q ? q.hint : undefined;
  const optional = optionalFields.has(field);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');

  const title = (
    <>
      {q.question}
      {optional && (
        <span className="ml-3 align-middle font-mono text-xs text-fg3 uppercase">Optional</span>
      )}
    </>
  );
  const titleClass = 'font-display text-2xl text-balance text-fg0';

  const below = (
    <>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-fg3">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-2 text-sm text-fgSerious">
          <PixelBang className="mt-[5px] shrink-0" />
          {error}
        </p>
      )}
    </>
  );

  if (field === 'industry') {
    return (
      <fieldset
        className="flex flex-col gap-4"
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
      >
        <legend className={cn(titleClass, 'mb-4')}>{title}</legend>
        <div className="flex flex-wrap gap-2">
          {copy.industries.map((option) => (
            <DitherChoice
              key={option.value}
              name="industry"
              value={option.value}
              label={option.label}
              checked={industry === option.value}
              onChange={() => onIndustry(option.value)}
              invalid={Boolean(error)}
              required
            />
          ))}
        </div>
        {below}
      </fieldset>
    );
  }

  const shared = {
    id,
    name: field,
    required: !optional,
    defaultValue,
    invalid: Boolean(error),
    maxLength: intakeLimits[field],
    placeholder: 'placeholder' in q ? q.placeholder : undefined,
    'aria-describedby': describedBy || undefined,
  };

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor={id} className={titleClass}>
        {title}
      </label>
      {multiline.has(field) ? (
        <DitherTextarea {...shared} rows={4} />
      ) : (
        <DitherInput
          {...shared}
          type={field === 'email' ? 'email' : 'text'}
          autoComplete={autoComplete[field]}
          inputMode={field === 'email' ? 'email' : undefined}
          autoCapitalize={field === 'email' ? 'off' : undefined}
          spellCheck={field === 'email' ? false : undefined}
        />
      )}
      {below}
    </div>
  );
}

const autoComplete: Partial<Record<IntakeField, string>> = {
  name: 'name',
  email: 'email',
  company: 'organization',
};

/* Submit ----------------------------------------------------------------------------------- */

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      // aria-disabled (not disabled) keeps focus on the button while the request runs.
      aria-disabled={pending || undefined}
      className={cn(
        'inline-flex h-11 items-center justify-center bg-pumpkin-500 px-5 font-medium text-black',
        'transition-[background-color,translate] duration-150 motion-reduce:transition-none',
        'hover:bg-pumpkin-400 active:translate-y-px active:bg-pumpkin-600',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fgAccent1',
        'aria-disabled:cursor-progress aria-disabled:hover:bg-pumpkin-500 aria-disabled:active:translate-y-0',
      )}
    >
      {/* Both labels share one grid cell so the button never changes width mid-request. */}
      <span className="grid">
        <span className={cn('col-start-1 row-start-1', pending && 'invisible')}>{label}</span>
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
  const item = form.elements.namedItem(field);
  if (item instanceof RadioNodeList) {
    const radios = [...item] as HTMLInputElement[];
    (radios.find((r) => r.checked) ?? radios[0])?.focus();
  } else if (item instanceof HTMLElement) {
    item.focus();
  }
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

function PixelBang({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 2 10"
      width={2}
      height={10}
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
    >
      <path d="M0 0h2v6H0zM0 8h2v2H0z" />
    </svg>
  );
}
