import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { launch } from '@/content/launch';

/**
 * Starting point for the exercise. Everything on this page is a placeholder —
 * replace it with your own components. See README.md for the brief.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/pumpkin.svg" alt="" width={28} height={28} />
          <span className="font-display text-lg font-semibold text-fg0">DeadKit</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/tokens" className="font-mono text-xs text-fg3 uppercase hover:text-fg1">
            Tokens
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-6 py-24">
        <p className="font-mono text-xs text-fgAccent1 uppercase">{launch.eyebrow}</p>
        <h1 className="font-display text-5xl text-fg0">{launch.headline}</h1>
        <p className="max-w-xl text-lg text-fg2">{launch.subhead}</p>
        <div className="flex gap-3">
          <a href={launch.primaryCta.href} className="bg-pumpkin-500 px-4 py-2 text-black">
            {launch.primaryCta.label}
          </a>
          <a href={launch.secondaryCta.href} className="border px-4 py-2">
            {launch.secondaryCta.label}
          </a>
        </div>
      </main>
    </div>
  );
}
