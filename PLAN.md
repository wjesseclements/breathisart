# PLAN.md — Stillpoint build plan

Vertical slices, in order. Each slice leaves the app runnable (`npm run dev`) and green on `npm run lint && npm run test && npm run build`. Check items off as they land; one slice per commit set.

---

## Slice 1 — Scaffold & toolchain
Goal: an empty but fully wired app. Everything later builds on a green pipeline.

- [x] Vite + React 18 + TypeScript (strict) project scaffolded
- [x] Tailwind configured with initial design tokens (dark-first palette: deep navy/charcoal bg, teal→indigo accent) in `tailwind.config`
- [x] React Router with `/` (Home) and `/research` (Research) placeholder pages
- [x] Vitest wired with one trivial passing test; ESLint + Prettier configured
- [x] Target folder structure stubbed (`src/engine`, `src/components`, `src/pages`, `src/store`)
- [x] GitHub Actions CI workflow: lint + test + build on every push/PR
- [x] Vercel: repo connected, Vite preset, pushes to `main` deploy, PRs get preview URLs
- [x] Verify: `npm run dev` shows both routes; lint/test/build all pass with zero TS errors; CI green on the first push; placeholder app live on the Vercel URL

## Slice 2 — Breath engine (pure TS, no UI)
Goal: the one clock, fully unit-tested before any pixel moves. No React imports in `src/engine/`.

- [x] `Phase` / `BreathPattern` types per PRD §3 (ordered phase array — must represent the two-inhale physiological sigh)
- [x] `patterns.ts`: the five built-ins (Box, 4-7-8, Coherent 5.5/5.5, Extended Exhale 4/6, Physiological Sigh 3 / 1.5 "Top-off sip" / 6)
- [x] Pattern validation: reject phases ≤ 0s (min 0.5), cap 60s, require ≥1 phase, support decimals
- [x] Engine state machine: injectable clock (so tests don't need real rAF), `start/pause/resume/stop`, per-frame `tick(now)` → `{ phaseIndex, t, elapsed, cycles }`
- [x] Remainder carry across phase boundaries (no accumulated drift)
- [x] Tests: phase sequencing in order; pause/resume restores exact progress; zero drift over simulated 20 min; validation rejects/accepts correctly
- [x] Verify: `npm run test` green; engine file imports nothing from React

## Slice 3 — Minimal pacer (engine on screen)
Goal: you can actually breathe along. Ugly is fine; correct is mandatory.

- [ ] rAF subscription hook bridging engine → React (components never own timers)
- [ ] Orb scales with sinusoidal easing `0.5 − 0.5·cos(πt)` on inhale/exhale, steady on hold — `transform`/`opacity` only
- [ ] Phase word ("Breathe in" / "Hold" / "Breathe out", honoring phase `label` overrides) cross-fading
- [ ] Polite `aria-live` region announces phase changes
- [ ] Start by tapping the orb or a "Begin" button; pause/resume works
- [ ] Keyboard: space = start/pause
- [ ] `prefers-reduced-motion`: scaling replaced by opacity/color crossfade
- [ ] Verify: run dev, breathe a few box-breathing cycles; toggle OS reduced-motion and confirm fallback

## Slice 4 — Pattern picker + persisted state
Goal: choose any built-in pattern; choice survives reload.

- [ ] Zustand store (`useSettings`): selected pattern, persisted to localStorage
- [ ] Pattern chips under the orb (horizontally scrollable on mobile): Box, 4-7-8, Coherent, Calm, Sigh (+ disabled "Custom…" placeholder)
- [ ] Switching patterns resets/retimes the engine cleanly
- [ ] Keyboard: arrow keys cycle patterns
- [ ] Last-used pattern preloaded on visit
- [ ] 4-7-8 first-time lightheadedness tip (dismissible, per PRD §3)
- [ ] Verify: pick Sigh, confirm two inhales render; reload restores selection

## Slice 5 — Session lifecycle (HUD, wake lock, summary)
Goal: a complete session start-to-finish.

- [ ] SessionHUD: elapsed time, cycle count, pause, end (chips fade during session; tap reveals hidden controls)
- [ ] End-session summary ("6 min · 32 cycles") with "Again" / "Done"
- [ ] Keyboard: esc = end session
- [ ] Screen Wake Lock during active session, with feature detection
- [ ] `visibilitychange` → auto-pause (v1 behavior per PRD §3)
- [ ] Tests: engine exposes elapsed/cycles correctly through a full simulated session
- [ ] Verify: run a 1-min session end to end; background the tab and confirm auto-pause

## Slice 6 — Pacer visual polish
Goal: the hero earns its name. Touches only `transform`/`opacity`.

- [ ] Per-phase progress ring (sweeps once per phase)
- [ ] Layered halos: 2–3 blurred layers expanding at slightly different rates
- [ ] Idle ambient float before session start
- [ ] Optional countdown number (toggle wired in slice 8; default per PRD)
- [ ] Subtle background gradient/grain; per-pattern accent hue
- [ ] Reduced-motion variants for every new element (ring + text carry the pacing)
- [ ] Verify: DevTools performance trace shows no layout thrash during phase transitions; reduced-motion check

## Slice 7 — Custom pattern builder
Goal: users define, save, edit, and delete their own patterns.

- [ ] Settings drawer shell (low-contrast "···"/hamburger, slide-in via Framer Motion)
- [ ] Builder: add/remove/reorder phases, kind + seconds (steppers + direct input), name, save
- [ ] Live mini-preview of the orb running the draft pattern
- [ ] Validation reuses engine rules from slice 2 (shared, tested code path)
- [ ] Saved patterns persist (localStorage), appear in picker with edit/delete
- [ ] Verify: build a 3-phase custom pattern, run it, edit it, delete it, reload between steps

## Slice 8 — Settings: audio, haptics, session length, visual options
Goal: the rest of the drawer.

- [ ] WebAudio cue synthesis in `engine/audio.ts` (rising tone on inhale, falling on exhale, soft tick on hold) — off by default, volume slider, no audio files
- [ ] Haptics: `navigator.vibrate` pulse at phase changes (feature-detected)
- [ ] Session length: open-ended (default) or timed 3/5/10/custom with soft completion chime
- [ ] Visual options: countdown numbers on/off, theme dark/light/system, reduced-motion override
- [ ] All settings persisted in the Zustand store
- [ ] Verify: audible cue check, timed 3-min session chimes and ends, theme switch sticks across reload

## Slice 9 — Shareable pattern URLs
Goal: `/?p=in4-h7-out8` loads a pattern with no backend.

- [ ] Encode/decode for the query format (supports decimals and repeated kinds, e.g. `in3-in1.5-out6`)
- [ ] On load with `?p=`: validate, run it, offer "save this pattern"
- [ ] "Share" affordance on custom patterns copies the URL
- [ ] Tests: encode/decode round-trips for every built-in and edge cases (decimals, invalid input rejected)
- [ ] Verify: paste a hand-written URL, confirm the pacer runs it

## Slice 10 — Research page
Goal: `/research` ships the PRD §6 content **exactly** — including the null-result coherent-breathing trial and the safety/disclaimer block. No strengthened claims, no uncited benefits, no treatment language.

- [ ] Headline evidence cards (Fincham 2023 meta-analysis, Balban 2023 RCT, Fincham 2023 placebo-controlled null result) — claim → what the study did → what it found → citation link
- [ ] Mechanism section ("Why slowing the breath does anything at all")
- [ ] Per-technique notes (box, 4-7-8, coherent, sigh) with PRD's stated caveats
- [ ] Safety & disclaimer block incl. 988 link
- [ ] Readable layout (~65ch), floating back-to-breathing button
- [ ] Verify: side-by-side diff of page claims against PRD §6

## Slice 11 — Accessibility audit
Goal: audit only — keyboard controls, ARIA, and `aria-live` were built in slices 3–5; this slice verifies and closes gaps, adding nothing new by design.

- [ ] Keyboard audit: space/esc/arrows work as shipped in slices 3–5; visible focus states; drawer/builder fully operable keyboard-only
- [ ] ARIA audit: labels on all controls; polite `aria-live` phase announcements behave correctly
- [ ] Screen-reader walkthrough (VoiceOver) of a full session and the builder
- [ ] Color-contrast check on the low-contrast aesthetic (must still meet AA)
- [ ] Verify: Lighthouse accessibility ≥ 95; keyboard-only session start to finish

## Slice 12 — PWA, meta, onboarding
Goal: installable, offline, polished when shared.

- [ ] vite-plugin-pwa: manifest, icons, offline caching of the full bundle
- [ ] First-visit one-liner: "Follow the orb. In as it grows, out as it settles." (dismissible, never shown again)
- [ ] Open Graph/meta tags + favicon set
- [ ] Verify: install on a phone, airplane mode, full session offline

## Slice 13 — Final quality bar & custom domain
Goal: PRD §8 acceptance criteria met on the production deploy (Vercel pipeline has been live since slice 1).

- [ ] Lighthouse mobile: perf ≥ 95, a11y ≥ 95, best-practices 100; CLS ~0; no console errors
- [ ] 60fps check on a mid-range phone (or throttled emulation) during phase transitions
- [ ] Full test suite + lint + build green
- [ ] Custom domain + HTTPS; immutable cache on hashed assets, short cache on `index.html`
- [ ] Document the v1.5 backlog (streaks, soundscapes, panic-button PWA shortcut, multi-language) in the repo without building it

---

### Working agreements (from CLAUDE.md, restated so the plan is self-contained)
- One rAF clock in `src/engine/breathEngine.ts`; components never own timers.
- Patterns are phase arrays — anything that can't express the double-inhale sigh is wrong.
- Pacer animates only `transform`/`opacity`; reduced-motion support in every visual.
- Engine stays framework-free; run engine tests after every engine change.
- No new dependencies without asking.
