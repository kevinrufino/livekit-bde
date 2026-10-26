'use client';

import { useState } from 'react';

/** Dev helper for checking work in both themes. Feel free to restyle or replace. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.dkTheme = next;
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="font-mono text-xs text-fg3 uppercase hover:text-fg1"
    >
      Theme: {theme}
    </button>
  );
}
