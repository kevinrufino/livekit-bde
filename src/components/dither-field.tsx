'use client';

import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react';

import { pointAgentAtCaret } from '@/lib/agent-attention';
import { cn } from '@/lib/cn';

/**
 * Dithered state transitions for form controls.
 *
 * Every control sits on a `DitherSurface`: two stacked layers, the previous state's
 * colors underneath and the new state's colors on top. The top layer is revealed
 * left → right through a mask made of a solid bar plus a Bayer-dithered edge, so a
 * state change reads like a pixel progress bar sweeping across the field.
 */

/* Visual states ----------------------------------------------------------------------------- */

export type Tone =
  'idle' | 'hover' | 'focus' | 'typing' | 'done' | 'error' | 'selected' | 'progress';

const tones: Record<Tone, string> = {
  idle: 'border-separator2 border-b-fg4 bg-bg3',
  hover: 'border-fg4 bg-bg3',
  focus: 'border-fgAccent1 bg-bgAccent1',
  typing: 'border-pumpkin-400 bg-bgAccent2',
  done: 'border-fgAccent2 bg-bg2',
  error: 'border-fgSerious bg-bgSerious',
  selected: 'border-fgAccent1 bg-bgAccent2',
  progress: 'border-fgAccent1 bg-fgAccent1',
};

/* The dithered edge ------------------------------------------------------------------------- */

const CELL = 3; // px per dither dot — same grid as the orb and background
const EDGE_COLS = 24;
const EDGE_ROWS = 4;
const bayer4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** A strip that fades from solid (left) to empty (right) by ordered dithering. */
function buildEdge() {
  let rects = '';
  for (let x = 0; x < EDGE_COLS; x++) {
    const coverage = 1 - (x + 0.5) / EDGE_COLS;
    for (let y = 0; y < EDGE_ROWS; y++) {
      if (coverage > (bayer4[y][x % 4] + 0.5) / 16) {
        rects += `<rect x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}"/>`;
      }
    }
  }
  const w = EDGE_COLS * CELL;
  const h = EDGE_ROWS * CELL;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" shape-rendering="crispEdges">${rects}</svg>`;
  return { url: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, w, h };
}

const edge = buildEdge();
const wipeStyle = {
  '--dk-edge': edge.url,
  '--dk-edge-w': `${edge.w}px`,
  '--dk-edge-h': `${edge.h}px`,
} as CSSProperties;

/* DitherSurface ----------------------------------------------------------------------------- */

/**
 * Fills its positioned parent with the colors for `tone`, and wipes to the next
 * tone whenever it changes. Put it first inside a `relative` element.
 */
export function DitherSurface({ tone, className }: { tone: Tone; className?: string }) {
  const [layers, setLayers] = useState({ from: tone, to: tone, run: 0 });
  if (layers.to !== tone) setLayers({ from: layers.to, to: tone, run: layers.run + 1 });

  return (
    <span aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      <span className={cn('absolute inset-0 border', tones[layers.from])} />
      {layers.run > 0 && (
        <span
          key={layers.run}
          className={cn('dk-wipe absolute inset-0 border', tones[layers.to])}
          style={wipeStyle}
        />
      )}
    </span>
  );
}

/* Shared input state ------------------------------------------------------------------------ */

const TYPING_IDLE_MS = 700;

/**
 * empty → focus → typing → (pause) focus → (leave) done. Errors win over everything.
 * Also tells the orb where the caret is on focus and on every keystroke.
 */
function useFieldTone(invalid: boolean | undefined, initialValue: unknown) {
  const [focused, setFocused] = useState(false);
  const [filled, setFilled] = useState(String(initialValue ?? '').trim() !== '');
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const tone: Tone = invalid
    ? 'error'
    : focused
      ? typing
        ? 'typing'
        : 'focus'
      : filled
        ? 'done'
        : 'idle';

  const handlers = {
    onFocus(event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) {
      setFocused(true);
      pointAgentAtCaret(event.currentTarget, { pulse: false });
    },
    onBlur() {
      setFocused(false);
      setTyping(false);
      clearTimeout(timer.current);
    },
    onInput(event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) {
      const el = event.currentTarget;
      setFilled(el.value.trim() !== '');
      setTyping(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setTyping(false), TYPING_IDLE_MS);
      pointAgentAtCaret(el, { pulse: true });
    },
  };

  return { tone, handlers };
}

/* DitherInput / DitherTextarea -------------------------------------------------------------- */

const controlText =
  'relative w-full bg-transparent px-4 text-lg text-fg0 outline-hidden placeholder:text-fg3';

export type DitherInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'className'> & {
  invalid?: boolean;
  className?: string;
};

export function DitherInput({
  invalid,
  className,
  onFocus,
  onBlur,
  onInput,
  ...props
}: DitherInputProps) {
  const { tone, handlers } = useFieldTone(invalid, props.defaultValue ?? props.value);

  return (
    <div className={cn('relative', className)}>
      <DitherSurface tone={tone} />
      <input
        {...props}
        aria-invalid={invalid || undefined}
        onFocus={(e) => {
          handlers.onFocus(e);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          handlers.onBlur();
          onBlur?.(e);
        }}
        onInput={(e) => {
          handlers.onInput(e);
          onInput?.(e);
        }}
        className={cn(controlText, 'h-14')}
      />
    </div>
  );
}

export type DitherTextareaProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'className'> & {
  invalid?: boolean;
  className?: string;
};

export function DitherTextarea({
  invalid,
  className,
  onFocus,
  onBlur,
  onInput,
  rows = 4,
  ...props
}: DitherTextareaProps) {
  const { tone, handlers } = useFieldTone(invalid, props.defaultValue ?? props.value);

  return (
    <div className={cn('relative', className)}>
      <DitherSurface tone={tone} />
      <textarea
        {...props}
        rows={rows}
        aria-invalid={invalid || undefined}
        onFocus={(e) => {
          handlers.onFocus(e);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          handlers.onBlur();
          onBlur?.(e);
        }}
        onInput={(e) => {
          handlers.onInput(e);
          onInput?.(e);
        }}
        className={cn(controlText, 'block min-h-32 resize-none py-3')}
      />
    </div>
  );
}

/* DitherChoice ------------------------------------------------------------------------------ */

export type DitherChoiceProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'className'> & {
  label: string;
  invalid?: boolean;
};

/** A radio option drawn as a chip. Use several with the same `name` inside a fieldset. */
export function DitherChoice({
  label,
  invalid,
  checked,
  onFocus,
  onBlur,
  ...props
}: DitherChoiceProps) {
  const [focusVisible, setFocusVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const tone: Tone = checked
    ? 'selected'
    : focusVisible
      ? 'focus'
      : invalid
        ? 'error'
        : hovered
          ? 'hover'
          : 'idle';

  return (
    <label
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="relative inline-flex h-10 cursor-pointer items-center gap-2.5 px-3 text-sm text-fg1 select-none"
    >
      <DitherSurface tone={tone} />
      <input
        {...props}
        type="radio"
        checked={checked}
        className="sr-only"
        onFocus={(e) => {
          setFocusVisible(e.currentTarget.matches(':focus-visible'));
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocusVisible(false);
          onBlur?.(e);
        }}
      />
      <span
        aria-hidden
        className={cn(
          'relative size-2 border',
          checked ? 'border-fgAccent1 bg-fgAccent1' : 'border-fg3',
        )}
      />
      <span className={cn('relative', checked && 'text-fg0')}>{label}</span>
    </label>
  );
}
