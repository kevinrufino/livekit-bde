'use client';

import { useId, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Form fields for DeadKit.
 *
 * Each field renders its own label, hint, and error, and wires up `id`,
 * `aria-describedby`, and `aria-invalid` for you. Fields are required by default —
 * pass `optional` to opt out, which also adds an "Optional" tag to the label.
 *
 *   <TextField name="email" type="email" label="Work email" error={errors.email} />
 *   <SelectField name="industry" label="Industry" placeholder="Pick one">…</SelectField>
 *   <TextareaField name="notes" label="Notes" optional maxLength={500} />
 */

type FieldOwnProps = {
  /** Visible label. Always shown — placeholders are not labels. */
  label: string;
  /** Helper text under the control. */
  hint?: ReactNode;
  /** Error message. Marks the control invalid and is read out with it. */
  error?: string;
  /** Field can be left blank. Adds an "Optional" tag to the label. */
  optional?: boolean;
  /** Classes for the outer wrapper (use for grid placement, spacing). */
  className?: string;
};

/* Shared control styling ------------------------------------------------------------------ */

const controlClasses = cn(
  'w-full rounded-none border border-separator2 border-b-fg4 bg-bg3 px-3 text-base text-fg0',
  'placeholder:text-fg3',
  'transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none',
  'outline-hidden hover:border-fg4',
  'focus:border-fgAccent1 focus:ring-1 focus:ring-fgAccent1',
  'aria-[invalid=true]:border-fgSerious aria-[invalid=true]:focus:ring-fgSerious',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

function describedBy(id: string, hint: unknown, error: unknown) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

type FieldFrameProps = Omit<FieldOwnProps, 'label'> & {
  id: string;
  label: string;
  /** Right side of the label row, e.g. a character counter. */
  aside?: ReactNode;
  children: ReactNode;
};

function FieldFrame({
  id,
  label,
  hint,
  error,
  optional,
  aside,
  className,
  children,
}: FieldFrameProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-mono text-xs tracking-wide text-fg2 uppercase">
          {label}
          {optional && <span className="ml-2 text-fg3 normal-case">(optional)</span>}
        </label>
        {aside}
      </div>

      {children}

      {hint && (
        <p id={`${id}-hint`} className="text-sm text-fg3">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-2 text-sm text-fgSerious">
          <PixelBang className="mt-1 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* TextField -------------------------------------------------------------------------------- */

export type TextFieldProps = FieldOwnProps &
  Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'required'>;

export function TextField({
  label,
  hint,
  error,
  optional,
  className,
  id,
  ...props
}: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <input
        {...props}
        id={fieldId}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(controlClasses, 'h-11')}
      />
    </FieldFrame>
  );
}

/* SelectField ------------------------------------------------------------------------------ */

export type SelectFieldProps = FieldOwnProps &
  Omit<ComponentPropsWithoutRef<'select'>, 'className' | 'required'> & {
    /** Shown until something is picked. Can't be re-selected. */
    placeholder?: string;
  };

/**
 * A native `<select>` — keeps the platform picker on mobile and full keyboard and
 * screen-reader support for free.
 */
export function SelectField({
  label,
  hint,
  error,
  optional,
  className,
  id,
  placeholder,
  children,
  defaultValue,
  ...props
}: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const isControlled = props.value !== undefined;

  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <div className="relative">
        <select
          {...props}
          id={fieldId}
          required={!optional}
          defaultValue={isControlled ? undefined : (defaultValue ?? (placeholder ? '' : undefined))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, hint, error)}
          className={cn(
            controlClasses,
            'h-11 appearance-none pr-10',
            // Dim the text while the placeholder is showing.
            "has-[option[value='']:checked]:text-fg3",
            '[&_option]:bg-bg2 [&_option]:text-fg0',
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <PixelChevron className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-fg3" />
      </div>
    </FieldFrame>
  );
}

/* TextareaField ---------------------------------------------------------------------------- */

export type TextareaFieldProps = FieldOwnProps &
  Omit<ComponentPropsWithoutRef<'textarea'>, 'className' | 'required'>;

/** Multi-line text. Pass `maxLength` to get a live character counter. */
export function TextareaField({
  label,
  hint,
  error,
  optional,
  className,
  id,
  maxLength,
  onChange,
  rows = 4,
  ...props
}: TextareaFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [typed, setTyped] = useState(String(props.defaultValue ?? '').length);
  const length = props.value !== undefined ? String(props.value).length : typed;
  const nearLimit = maxLength !== undefined && length >= maxLength * 0.9;

  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
      aside={
        maxLength !== undefined && (
          <span
            aria-hidden
            className={cn(
              'font-mono text-xs text-fg3 tabular-nums',
              nearLimit && 'text-fgModerate',
            )}
          >
            {length}/{maxLength}
          </span>
        )
      }
    >
      <textarea
        {...props}
        id={fieldId}
        rows={rows}
        maxLength={maxLength}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        onChange={(event) => {
          setTyped(event.target.value.length);
          onChange?.(event);
        }}
        className={cn(controlClasses, 'min-h-24 resize-y py-2.5')}
      />
    </FieldFrame>
  );
}

/* Pixel glyphs — drawn on the same 2px grid as the pumpkin mark ----------------------------- */

function PixelChevron({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 6"
      width={10}
      height={6}
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
    >
      <path d="M0 0h2v2H0zM8 0h2v2H8zM2 2h2v2H2zM6 2h2v2H6zM4 4h2v2H4z" />
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
