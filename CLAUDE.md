# CLAUDE.md

Project context for Claude Code. Read PRD.md for the full product spec — this file covers how to work in this repo.

## What this is
A static breath-pacing web app ("Stillpoint"): an animated orb paces inhale/hold/exhale, users pick built-in patterns (box, 4-7-8, coherent, physiological sigh) or build custom ones, and a `/research` page summarizes the evidence. No backend, no accounts, no analytics.

## Stack
- Vite + React 18 + TypeScript (strict mode on)
- Tailwind CSS; Framer Motion for UI chrome only
- Zustand for state; localStorage for persistence
- React Router: `/` and `/research`
- vite-plugin-pwa; Vitest for unit tests
- Deploy: Vercel from `main`

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (must pass with zero TS errors)
- `npm run test` — Vitest
- `npm run lint` — ESLint + Prettier check

Run `npm run lint && npm run test && npm run build` before declaring any task complete.

## Architecture rules (non-negotiable)
1. **One clock.** All breath timing lives in `src/engine/breathEngine.ts`, driven by a single `requestAnimationFrame` loop. Components subscribe to engine state; they never own timers. No `setTimeout` chains, no CSS animation-duration sequencing for phases.
2. **Patterns are arrays of phases** (`{kind, seconds, label?}`), not fixed in/hold/out/hold fields. The physiological sigh has two inhales — any design that can't represent it is wrong.
3. **Animate only `transform` and `opacity`** in the pacer. If a change would animate width/height/top/left/box-shadow, find another way.
4. **`prefers-reduced-motion` support is mandatory** in every visual you touch: scaling falls back to opacity/color crossfade.
5. Engine logic must stay framework-free (pure TS, no React imports) so it's unit-testable.
6. Accessibility is a feature, not a pass: keyboard controls (space/esc/arrows), ARIA labels, polite `aria-live` phase announcements.

## Code style
- TypeScript strict; no `any` (use `unknown` + narrowing if needed).
- Functional components + hooks; no class components.
- Small files: if a component passes ~150 lines, split it.
- Tailwind utilities over custom CSS; shared design tokens in `tailwind.config`.
- ES modules, named exports (default export only for route pages).
- No new dependencies without asking — this app should stay tiny.

## Content rules
- Research page claims must match PRD.md §6 exactly, including the null-result coherent-breathing trial and the safety/disclaimer block. Do not strengthen claims or add uncited benefits.
- Never add language implying the app treats or cures any condition.

## Testing expectations
- `breathEngine`: phase sequencing, pause/resume restores exact progress, remainder carry across boundaries (no drift over simulated 20 min), pattern validation (reject ≤0s phases, cap 60s, require ≥1 phase).
- Pattern URL encoding/decoding round-trips.
- Run tests after every engine change, not just at the end.

## Git workflow
- Commit after each completed slice or meaningful sub-step, message form: "Slice N: what changed".
- Never commit with failing lint/tests.
- Never push unless explicitly asked.

## Workflow
- Work in small vertical slices (see PLAN.md if present). One feature per branch/commit set; descriptive commit messages.
- When a task is ambiguous, ask before building — especially anything touching the pacer's look and feel.
- Never commit secrets (there shouldn't be any — this app needs no keys).
- Update this file when you discover a convention worth keeping.
