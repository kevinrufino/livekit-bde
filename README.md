# DeadKit — Design Engineer exercise

DeadKit is a (fictional) realtime voice platform for talking to the departed. We're
launching **Séance 1.0**, and the brand team needs a launch page — and the components
behind it — that feel unmistakably DeadKit.

This repo is an early-stage Next.js + Tailwind project with a small token set and one
logo. Everything else is up to you.

## Getting started

```bash
pnpm install
pnpm dev
```

- `/` — the starting point. Replace it.
- `/tokens` — reference for the colors, type, and logo you have to work with.

## The brief

Plan for about **2 hours**. We'd rather see a few things done with real care than
everything done quickly — it's fine to leave parts unfinished, just tell us what you'd
do next.

### 1. Logo

Build a reusable `Logo` component from `public/brand/pumpkin.svg`.

- Should work as a mark alone and as a lockup with the "DeadKit" name.
- Should be usable at very different sizes (a 16px nav icon and a 240px hero moment).
- Give it some life: an entrance, an idle state, or a response to interaction. The
  mark is built from simple pixel blocks — use that.

### 2. Button

Build a `Button` that becomes the default call-to-action across the site.

- At least a primary (brand) and a secondary treatment.
- Considered hover, press, focus, and disabled states.
- Works as a link as well as a `<button>`.

### 3. Launch page

Use your components to build the Séance launch page at `/`. Copy is in
`src/content/launch.ts` — use as much or as little as you like.

Include at least one **brand moment**: an animation or interaction that you think makes
this page memorable. It's your call what that is.

### What we're looking for

- Components that another engineer could pick up and reuse without reading their source.
- Brand colors and assets used with intent — through the tokens, not around them.
- Motion and interaction that feel purposeful, not decorative.
- Something that looks good. Works in light and dark, on mobile and desktop.
- Respect for accessibility, including `prefers-reduced-motion`.

## What's in the box

| Path                    | What it is                                                    |
| ----------------------- | ------------------------------------------------------------- |
| `src/styles/tokens.css` | Raw palette + semantic light/dark tokens (`--dk-color-*`)     |
| `src/app/globals.css`   | Tailwind theme wired to the tokens (type scale, radii, fonts) |
| `public/brand/`         | Brand assets                                                  |
| `src/content/launch.ts` | Launch page copy                                              |
| `src/lib/cn.ts`         | `cn()` class-merging helper                                   |
| `src/components/`       | A dev-only theme toggle — the rest is yours                   |

**Tokens.** Tailwind's default palette has been replaced: only DeadKit colors exist.
Prefer the semantic utilities (`text-fg1`, `bg-bg2`, `border-separator1`,
`text-fgAccent1`) so things work in both themes; reach for the raw scale
(`bg-pumpkin-500`) when the brand color itself is the point. `pumpkin-500` (#F97A1F)
is DeadKit Orange.

**Theme.** Set with `data-dk-theme="dark" | "light"` on any element. Tailwind's
`dark:` and `light:` variants follow it.

**Fonts.** `font-display` (Space Grotesk), `font-sans` (Public Sans), `font-mono`
(JetBrains Mono).

**Dependencies.** [`motion`](https://motion.dev) is installed if you want it. CSS-only is
just as welcome, and you can add any other library you'd reach for — tell us why.

## When you're done

Send us a link to your repo (or a zip, without `node_modules`) and a few sentences on:

- the decisions you're happiest with,
- what you'd do with another day,
- anything you'd push back on in the brief.
