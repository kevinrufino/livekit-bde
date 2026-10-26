import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';

const rawScales = ['pumpkin', 'purple', 'gray'] as const;
const steps = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

const semantic = {
  Foreground: [
    'fg0',
    'fg1',
    'fg2',
    'fg3',
    'fg4',
    'fgAccent1',
    'fgAccent2',
    'fgSecondary1',
    'fgSuccess',
    'fgModerate',
    'fgSerious',
  ],
  Background: [
    'bg0',
    'bg1',
    'bg2',
    'bg3',
    'bgAccent1',
    'bgAccent2',
    'bgSecondary1',
    'bgSuccess',
    'bgModerate',
    'bgSerious',
  ],
  Separator: ['separator1', 'separator2', 'separatorAccent'],
} as const;

// Spelled out in full so Tailwind can find the class names.
const typeScale = [
  ['8xl', 'text-8xl'],
  ['6xl', 'text-6xl'],
  ['5xl', 'text-5xl'],
  ['4xl', 'text-4xl'],
  ['3xl', 'text-3xl'],
  ['2xl', 'text-2xl'],
  ['xl', 'text-xl'],
  ['lg', 'text-lg'],
  ['base', 'text-base'],
  ['sm', 'text-sm'],
  ['xs', 'text-xs'],
] as const;

/** Reference page for the token set. Not part of the exercise. */
export default function TokensPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-16 px-6 py-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-mono text-xs text-fg3 uppercase hover:text-fg1">
          ← Back
        </Link>
        <ThemeToggle />
      </header>

      <section className="space-y-6">
        <h2 className="font-display text-3xl text-fg0">Brand</h2>
        <div className="flex items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/pumpkin.svg" alt="DeadKit logo" width={96} height={96} />
          <div className="space-y-1">
            <p className="font-display text-4xl font-semibold text-fg0">DeadKit</p>
            <p className="font-mono text-xs text-fg3">pumpkin-500 · #F97A1F</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-3xl text-fg0">Raw colors</h2>
        {rawScales.map((scale) => (
          <div key={scale} className="space-y-2">
            <p className="font-mono text-xs text-fg3">{scale}</p>
            <div className="grid grid-cols-9 gap-1">
              {steps.map((step) => (
                <div key={step} className="space-y-1">
                  <div
                    className="h-12 rounded border"
                    style={{ background: `var(--dk-color-${scale}-${step})` }}
                  />
                  <p className="font-mono text-xs text-fg4">{step}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-sm text-fg3">
          Also available: <code className="font-mono">green</code>,{' '}
          <code className="font-mono">amber</code>, <code className="font-mono">red</code> (see{' '}
          <code className="font-mono">src/styles/tokens.css</code>). Gray resolves differently per
          theme.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-3xl text-fg0">Semantic colors</h2>
        <p className="text-sm text-fg3">
          Use these as Tailwind utilities, e.g. <code className="font-mono">text-fg2</code>,{' '}
          <code className="font-mono">bg-bgAccent1</code>,{' '}
          <code className="font-mono">border-separator1</code>.
        </p>
        {Object.entries(semantic).map(([group, names]) => (
          <div key={group} className="space-y-2">
            <p className="font-mono text-xs text-fg3">{group}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {names.map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <div
                    className="size-8 shrink-0 rounded border"
                    style={{ background: `var(--dk-color-${name})` }}
                  />
                  <p className="truncate font-mono text-xs text-fg2">{name}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-3xl text-fg0">Type</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <p className="font-display text-2xl">Display — Space Grotesk</p>
          <p className="font-sans text-2xl">Sans — Public Sans</p>
          <p className="font-mono text-2xl">Mono — JetBrains Mono</p>
        </div>
        <div className="space-y-3 overflow-hidden">
          {typeScale.map(([size, className]) => (
            <div key={size} className="flex items-baseline gap-4">
              <p className="w-12 shrink-0 font-mono text-xs text-fg4">{size}</p>
              <p className={`${className} truncate font-display text-fg0`}>Trick or treat</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
