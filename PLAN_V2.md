# PLAN_V2.md — Stillpoint visual & UX overhaul

Continues PLAN.md (slices 1–13 shipped). Same working agreements: each slice leaves the app runnable and green on `npm run lint && npm run test && npm run build`; one slice per commit set; check items off as they land.

## Decisions taken (2026-09-27)

All four open questions are resolved. Recorded here so no slice re-litigates them.

1. **Pacer look and feel — approved.** Scale range moves from 0.62→1.0 (2.6× area) to 0.84→0.965 (1.32× area); expressiveness moves out of size and into luminance, atmosphere, and a room that responds. Real lungs move ~1.28× in radius. If it reads as too subtle once built, raise `MIN_SCALE` from 0.84 toward 0.78 — one constant, the lighting model is unaffected.
2. **Lead-in — ship it, per-pattern.** Default 3s, user-overridable, **`leadInSeconds: 0` on the physiological sigh**. The sigh is the panic-button pattern (1–3 cycles at 10.5s, and a PWA home-screen shortcut in BACKLOG.md); a settle beat fights that use case while helping every other pattern.
3. **Display font — `ui-serif`, nothing vendored.** Zero bytes on an offline-first PWA. The upgrade path is reassigning one custom property, so this is never a prerequisite and can be revisited any time. Known cost: Georgia has no light weight, so the phase word renders at 400 on Windows.
4. **Audio — unbundled.** The re-voicing (slice 23) ships regardless of defaults: a 0.12s pip with a 40ms attack is a click, which is a bug, not a preference. Phase tones **stay off by default** — a stress tool gets opened in open-plan offices — but the toggle moves out of the drawer onto the idle screen, because nobody discovers it today.

---

## Direction — "Vesper: one lamp in a dark room"

The orb is the only light source in frame, and every other pixel is what that light does to the room. Breath should be legible as **light** before it is legible as **size**.

The current orb fails because it is a *shape*: a two-stop linear gradient with a vector-crisp edge, two flat-teal blurred discs behind it, and one `level` value driving scale, opacity, accent and both halos on the same frame. Shapes are read once and dismissed. The fix is to commit to one physical fiction and render it honestly — an alabaster vessel with a light inside it, sitting in a dark room — and to split the breath across time so it reads as an object displacing air rather than a pulsing badge.

**Five principles that decide every later judgment call:**

1. **One fiction.** Matte body, one internal source off-axis at 38%/31%, bottom occlusion, Fresnel rim, contact shadow. No gloss, no chrome, no decoration. If a layer can't be justified by the lighting model, it doesn't ship.
2. **Zero `filter` in the pacer.** Not "static filters are allowed" — none. Every soft edge is authored into gradient stops plus one static `mask-image`. This deletes both 64px blurs (today's most expensive layers), removes the static-filter-under-an-animated-ancestor hazard by construction, and kills the visible knee that makes the halos read as a bubble inside a bubble.
3. **One clock, many time constants.** Body fills at t+0, glows at t+180ms, the near air follows at t+190ms, the room at t+440ms. All derived from `onFrame(snap)`. Amplitude gains (`Math.pow`) are not parallax — they change how far, not when.
4. **Luminance up on inhale; chroma and weight up on exhale.** Today full exhale drains to desaturated mist, so the parasympathetic beat — the thing the app exists for — reads as the light switching off. The exhale must *deepen*. Release, not loss.
5. **Every gradient reaches `transparent` inside its own box** (76–97%), or a boundary shows. With no blurs to hide edges, this is a per-gradient checkable rule.

---

## What's wrong today

The review produced 79 findings across five dimensions. The eight that matter most:

1. **The session state has the worst layout in the app.** `invisible opacity-0` on the idle furniture block (`Home.tsx:212`) keeps its box, so the orb sits near the top of a half-empty screen for the entire session. `invisible` also strips Pause/End from the tab order *and* the accessibility tree 4s into every session.
2. **The body is a 2-stop linear gradient** — a flat coin, not a lit sphere. No specular, no bounce, no rim; a vector-crisp silhouette with no atmosphere boundary.
3. **The halos are muddy because of blend mode, not hue.** Teal `#2dd4bf` at 15% `normal` over `#0b1020` averages to `#102d38` — chroma collapses 0.133 → 0.040, hue swings 182°→226°. No hue choice fixes that while the blend is `normal`.
4. **Everything peaks on the same frame.** Scale, orb opacity, accent layer and both halos are all instantaneous functions of one `level`. `Math.pow(level, 1.15)` / `Math.pow(level, 0.85)` is amplitude, not phase offset.
5. **Holds are a frozen frame.** Box breathing spends 8 of every 16 seconds with literally nothing moving after the follower settles in ~280ms. A frozen frame reads as a hang.
6. **There is no type scale and no display face.** `fontFamily.display` is `['system-ui','sans-serif']` — the hero word is the same face as every button. 24× `text-sm`, 10× `text-xs`, two isolated `text-3xl`, and nothing between 20px and 30px, so hierarchy has to be attempted with color alone.
7. **Light mode has no Pacer design.** The identical dark gradient ships into light mode: `#1a2238` on `#f1f5f9` is a 14.4:1 void punched in the page. 107 ad-hoc `dark:` variants across 18 files, each a place light mode silently inherits a dark-first decision.
8. **The session has no beginning and no ending.** `start()` begins expanding the same frame your finger leaves the button; the close is a receipt ("6 min · 32 cycles") that scores the one thing in this product that should not be scored.

---

## Slice 14 — Semantic token layer (mechanical, no visual intent)
Goal: one place where color lives, so every later slice can be about design instead of about find-and-replace. **Nothing should look different when this lands.**

> **Token values in this slice are today's exact colors, not the target palette.** The plan's target values (`--scene-top #171a31`, `--ink-muted #a2a6af`, …) are written as `target:` comments beside each token and get flipped deliberately in slices 15/16/20, where the layers that consume them are actually built. Mixing a structural refactor with a color change in one commit means that if something looks wrong you can't tell which caused it. This keeps the diff screenshot-clean and reviewable per file.

- [x] Add CSS custom properties to `src/index.css` as **raw channel triplets** — `--accent-core: 172 193 209` — consumed as `rgb(var(--accent-core) / <alpha-value>)`. The naive `var(--x)` form silently breaks every Tailwind alpha modifier (`text-ink-muted/60`); this is the whole reason for the triplet form.
- [x] Surface/line tokens at today's values — dark: `--surface-page #0b1020`, `--surface-raised #11172b`, `--surface-sunken #0b1020`, `--surface-selected #1a2238`, `--line #1a2238`; light: `#f1f5f9` / `#ffffff` / `#ffffff` / `#e2e8f0` / `#cbd5e1`
- [x] Ink tokens at today's values — dark: `--ink-strong #e2e8f0`, `--ink #cbd5e1`, `--ink-muted #94a3b8`, `--phase-word #a6acb6` (the flattened composite of `whisper` over `night`); light: `#1e293b` / `#334155` / `#475569` / `#334155`
- [x] Accent/focus tokens — dark `#2dd4bf`, light `#0d9488` (`--accent-strong` light `#0f766e`)
- [x] Map the tokens into `tailwind.config.js` `theme.extend.colors` so `bg-surface-raised` / `text-ink-muted` work as utilities
- [x] **Write the measured contrast ratio as a `min-contrast` comment beside every token.** This is the discipline that would have prevented today's 1.05:1 light-mode numeral and 1.2:1 borders.
- [x] Sweep all 107 `dark:` sites across 18 files to the token utilities (hotspots: `Research.tsx` ×13, `PreferencesSection.tsx` ×7, `ui.ts`, `index.css`). Per-file, reviewable, no value changes.
- [x] Extract the focus ring — a 130-character literal pasted into 12 files with three different offsets — into one `focusRing` export in `src/components/ui.ts`
- [x] Convert `pacerTheme.ts` from literal Tailwind class strings to **data**: `PATTERN_ACCENTS: Record<string, { dark: AccentTokens; light: AccentTokens }>` of hex triples. `Pacer` sets the custom properties in a `style` object on the button; layers reference `rgb(var(--accent-core))` in static classes. The Tailwind-scanner problem that forced the literal strings disappears, and the rAF loop stays color-agnostic — it only ever writes numbers.
- [x] Verify: lint clean, 53/53 tests, build OK.
- [x] Verify: **measured** before/after pixel diff of `/` and `/research` in both themes, via headless Chrome against the production build (deterministic: `--virtual-time-budget` fixes the animation frame). Results:

  | view | differing pixels | max channel delta |
  |---|---|---|
  | home, light | 0 / 1,080,000 (0.000%) | 0 |
  | research, light | 0 / 1,080,000 (0.000%) | 0 |
  | home, dark | 1,446 (0.134%) | 7 |
  | research, dark | 2,525 (0.234%) | 2 |

  Light mode is pixel-identical. The dark deltas are confined to antialiased text edges on
  `text-ink-display`, and are the known `whisper` flattening (a translucent color traded for an
  opaque token — see the note in `index.css`). Predicted ≤6/255 analytically, measured 7 on
  antialiased edges. Below the perceptual threshold and retuned in slice 20.

> Touches the tailwind token layer and `index.css` — ripples everywhere. Land it alone, commit it alone.

---

## Slice 15 — The lit orb
Goal: the single largest perceived-quality jump in the plan. The orb stops being a shape and becomes a body.

**DECIDED (see Decisions taken §1): approved.** 11 nodes, a new lighting model, scale range 0.84→0.965. If the breath reads as too subtle in the built version, `MIN_SCALE` 0.84 → 0.78 is the single knob; the lighting model doesn't change.

- [x] Container: `h-[min(17rem,44svh)] w-[min(17rem,44svh)]` (272px nominal; shrinks in landscape, fixing short-viewport overflow)
- [x] **`.body`** — fully static, `opacity` permanently 1. Two stacked radial gradients (core light over a four-stop body ramp so the luminance derivative is non-monotonic: shoulder, fast mid-roll, dark limb), origin `38% 31%` / `42% 37%`; `box-shadow: inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -20px 34px -20px rgba(2,4,14,0.62), inset 0 0 0 1px rgba(255,255,255,0.055)`; `mask-image: radial-gradient(circle at 40% 36%, #000 0 71%, rgba(0,0,0,0.88) 87%, rgba(0,0,0,0.55) 96%, transparent 100%)` with the `-webkit-` duplicate. The mask is the entire edge story — it eats the shadow-side limb while the lit limb keeps a crisp terminator.
- [x] **`.innerLight`** [rAF: opacity] on a τ=0.22 follower — peaks ~180ms after the body. The orb fills, *then* glows.
- [x] **`.depth`** [rAF: opacity] rising to 0.46 at `multiply` as the body empties — **on a τ=0.30 lagging follower over `(1 − target)`, not an instantaneous `0.46*(1-level)`**, so the deepening continues into the hold after the exhale ends. This is principle 4 actually rendered rather than claimed.
- [x] **`.rim`** [rAF: opacity] — static gradient + static directional mask at 145°, agreeing with the key light
- [x] **`.bounce`** [rAF: opacity] — first item on the cut list if profiling demands it (merge into the body gradient)
- [x] **`.caustic`** — **two counter-rotating lobes at incommensurate rates (+0.55°/s and −0.31°/s, ratio 1.774)**, so the interference never repeats and no coherent crawl direction can build against the static grain tile
- [x] **`.grain`** — fully static, never touched, its own non-rotating node
- [x] **`.fieldNear`** (`-inset-[22%]`) and **`.fieldFar`** (`-inset-[46%]`) — five-stop radial gradients replacing `blur-3xl`/`blur-2xl`, `mix-blend-mode: var(--glow-blend)`. `--field-far` is violet-shifted (`129 140 248`): atmosphere is cooler than its source. Followers τ=0.19 and τ=0.44.
- [x] **`.ground`** — contact shadow ellipse at `top-[86%]`. This is what makes it an object rather than a sprite.
- [x] Wrap blend modes in `@supports (mix-blend-mode: plus-lighter)`, defaulting `--glow-blend: screen`. Field gradients must read correctly under `screen` alone.
- [x] `pacerMath.ts`: replace the single τ=0.07 critically-damped follower with a **second-order follower, ζ=0.72**, overshooting ~4% at the turn and settling over ~350ms. A first-order follower is monotonic by construction, which is why today's turn reads as interpolated.
- [x] **Clamp the follower output to ≤1.0** (and keep `MAX_SCALE = 0.965`). Never scale a composited layer above 1 — it resamples a texture rasterized smaller and visibly softens the 1px rim hairline this slice is spending its budget on.
- [x] Area-map the scale: perceived size tracks area, not radius
- [x] `wobble(cycles) = 0.9885 + 0.023 * hash01(cycles)` multiplying **drawn amplitude only**, so the loop is never machine-stamped
- [x] Ring: `dashoffset = kind === 'exhale' ? 100*t : 100*(1-t)` — one ternary. The arc grows while you fill or hold and retreats while you empty, so progress carries breath *direction*. Bonus: exhale→hold becomes continuous at zero on both sides, leaving one discontinuity per cycle instead of two. Move to `-inset-6`, thinner stroke, butt-capped.
- [x] Separate the boundary leads: `WORD_LEAD_S = 0.35` (people need ~300ms to act on a cue), `RING_FADE_LEAD_S = 0.25`. Today one 0.25s constant leads the word while the follower lags the body — a ~320ms disagreement twice per cycle where the text says "Hold" before the orb stops growing.
- [x] **Reduced motion:** clamped scale `0.90 → 0.965` (1.15× area, monotonic, far below vestibular-trigger thresholds); **body stays fully opaque** — today's `opacity: 0.55→1.0` on the silhouette lets the page show *through* the orb, so it reads as semi-transparent rather than as a body at lower luminance; interior layers modulate instead. Add **`.waterline`**: a transform-only rising level with a **1.5px bright meniscus line** above the wash — readable as direction from a single still frame, which is what today's fallback (1.51:1, non-directional) entirely lacks. First-order τ=0.20 glide, no overshoot, no lift, no rotation.
- [x] **A11y:** contrast-sandwich the focus ring on the orb (`ring-2 ring-scrim ring-offset-2`) so there's always a dark separator between the bright rim and the ring
- [x] Tests: `pacerMath` — peak overshoot lands in 3–6%; 20-minute simulation accumulates no offset; **`wobble` guard test asserting phase boundaries and announced durations are bit-identical with and without it** (it must never become a lie about the breath)
- [x] Verify: 66/66 tests green; lint, tsc and build clean; per-frame writes confirmed to be `transform`/`opacity`/`strokeDashoffset` only; zero `filter` in `src/components/Pacer/`; headless-Chrome captures at idle, mid-inhale, top-of-breath and under `--force-prefers-reduced-motion`.
- [ ] *Still owed:* Safari iOS check (`mask-image` is the one craft element with no fallback — it degrades to today's hard edge, it doesn't break), and a DevTools raster/GPU trace on real hardware (slice 24).

### Two corrections to the direction, found while building

1. **The 1.005 overshoot ceiling was self-contradictory.** Clamping follower output at 1.005 makes the ~4% overshoot that justifies a second-order follower impossible — the unit test caught it immediately. The clamp was also unnecessary: because scale is mapped by *area*, a 3.3% overshoot in level compresses to ~0.5% in scale, and `MAX_SCALE` 0.965 already leaves 3.5% of headroom. Replaced with `LEVEL_GUARD = 1.08`, a pure divergence guard, plus a test asserting the drawn scale stays below 1.0 even at the guard value and maximum wobble.
2. **Every radial gradient was authored as if `100%` meant the orb's edge.** CSS defaults `radial-gradient` sizing to `farthest-corner` — 70.7% of a square box, and further still when the origin is offset. The consequence was invisible in code and obvious in a screenshot: the body ramp never reached its floor stop, and the mask's dissolve *and* the rim's annulus both landed entirely outside the visible circle, so the orb had no soft terminator and no Fresnel rim at all. Fixed by sizing all eight gradients explicitly (`ellipse 67% 67%` for the body layers, `closest-side` for the rim, `farthest-side` for the fields).

   A note on method: pixel-diffing is only valid for **static** states. A control
   run — identical build, captured twice mid-session — differed on 4.1% of pixels,
   because the capture races the breath animation. Slice 14's diff was sound
   because both pages were at rest; slice 15 is verified by unit tests, the
   compliance greps (per-frame writes, zero `filter`) and visual reads instead.

   A third, related finding: the fields' energy was concentrated where the orb hides it. Measured atmosphere brightness just outside the limb was flat (21.4 → 21.0 mean channel from r=180 to r=300, against a 19.7 background — i.e. no visible bloom). Re-authoring the stops outward gives a real falloff: **39.0 → 30.1 → 23.4 → 21.0**.

---

## Slice 16 — The room
Goal: the scene stops being a backdrop and starts being a room the orb lights.

- [x] Rebuild `Background.tsx` as five layers, `fixed inset-0 -z-10`
- [x] **Base ramp** (static): `linear-gradient(176deg, --scene-top 0%, --scene-mid 44%, --scene-low 78%, --scene-floor 100%)`. ΔL ≈ 0.105, 1.22:1 — felt as light in the room with no discernible boundary, darkest at the bottom so depth falls away below the orb. The 4° tilt off vertical reads as photographed rather than generated. Replaces today's layer, whose effective peak alpha of 0.03 (`rgba(45,212,191,0.5)` inside `opacity-[0.06]`) lands at 1.04:1 — below display quantization, invisible, and paid for with a promoted layer 2.25× the viewport.
- [x] **Sky glow** (static paint, CSS-animated opacity): ellipse anchored at `50% 14%` — **above** the orb, so the orb is backlit. Opacity 0.58 → 0.80 over **27s**, asymmetric curve. Deliberately not phase-locked and deliberately slower than any breath: today's 18s sits close enough to a box cycle (16s) that it drifts in and out of phase with the pacer and reads as a contradictory cue.
- [x] **Cast light** (rAF-driven opacity): `opacity = 0.18 + 0.52*farLevel`, written by the pacer's own loop, trailing the breath by ~440ms. One extra opacity write per frame; it is the single change that makes the scene *respond to* the orb.
- [x] **Vignette** (static): frames the orb and hides the sky-glow and cast-light edges
- [x] **Grain** (static, on top, as dither): shared monochrome URI via `feColorMatrix`, `background-size: 112px 112px`, `opacity: 0.062`, `mix-blend-mode: overlay`. Fixes three bugs at once — `soft-light` barely moves backdrops near black, so at 0.04 the dark theme got under 0.5/255 and rendered nothing; the *same* layer over `#f1f5f9` did register, so light mode had more grain than dark, which is backwards; and the 160px tile upscaled at DPR 2 rendered 2× coarser than authored.
- [x] **Reduced motion:** sky-glow pulse off, cast light held static at 0.34, ambient float off. The room is lit and still; only the orb's light moves.
- [x] Verify: lint clean, 66/66 tests, build OK. Measured scene luminance — ramp alone 1.18:1 top-to-bottom (direction specified 1.22:1), composed scene 1.43:1 because the sky backlight lifts the top, which is the backlight working rather than the ramp being wrong.
- [x] Softened the vignette from the specified 0.30/0.62 to 0.18/0.40: at the original values the corners bottomed out near rgb(3,5,16), which reads as a vignette *filter* rather than a room.
- [x] The accent tokens moved from the orb element to the document root, because `Background` is not a descendant of the pacer and the sky glow and cast light both need the accent. Written only on pattern change, never per frame.
- [ ] *Still owed:* light-theme scene values are a neutral placeholder derived from today's slate; slice 20 warms them toward paper.

> **DECISION NEEDED:** the cast-light layer requires `Home` to own a ref and pass it to both `Pacer` and `Background`, so the pacer's loop writes `roomLight.current.style.opacity`. That couples two otherwise-independent components. The alternative — a `--room-light` custom property on `documentElement` — triggers style recalc for every subscriber each frame, which is worse. *Recommendation: accept the ref.* If the coupling fails review, drop this layer; the direction survives, it just loses its best trick.

---

## Slice 17 — Type scale, button ranks, and composition
Goal: three readable groups instead of five equal bands, and a hero word that isn't the same face as the buttons.

- [x] `fontFamily.display: ['ui-serif','Iowan Old Style','Palatino Linotype','Georgia','Noto Serif','serif']`. `ui-serif` is a **system** font — New York on macOS/iOS, a genuinely good humanist serif at 300 weight and 40–68px; Georgia on Windows, Noto Serif on Android. Zero bytes, zero dependencies, instantly distinguishable from SF/Segoe chrome.
- [x] Seven named roles in `theme.extend.fontSize`, and ban raw `text-sm`/`text-xs` in new code: `label` 11px/0.16em uppercase · `meta` 13 · `ui` 15 · `body` 17 · `lede` 20 · `title` 28 · `display` `clamp(2.5rem,8.5vw,4.25rem)`. Ratios ≈1.18 at the bottom for dense meta, ≈1.43 at the top for drama. Weights use extremes, never the mushy middle: display 300, title 400, body 400, label 500 uppercase.
- [ ] **Split `PhaseWord` into `PatternTitle` + `PhaseWord`.** Today one 48px slot carries both "Box Breathing" (13 chars, an identifier read once) and "In" (2 chars, an instruction read peripherally 40 times) at identical size — which is why the idle title is too big to be a label and too small to be a hero, and why session start reads as a glitch. `PatternTitle` gains the phase string (`4 · 4 · 4 · 4`), the prose `tagline`, and `cycleSuggestion` — which is defined on all five built-ins and rendered in **zero** places today.
- [x] Crossfade stops overlapping: 200ms out, then 200ms in. Today's 600ms superimposed ghosting is ~15% of a box session. Under reduced motion, hard-swap with no outgoing span at all.
- [x] **Countdown comes off the orb** — a baseline companion to the phase word at `text-title tabular-nums text-countdown` (target 3.9:1 dark / 3.3:1 light, up from ~1.2:1). It currently plants a high-frequency focal point in the exact spot the product asks you to unfocus, and the new shading would destroy it further.
- [x] **Two button ranks.** Today `pillButton` is shared by Begin, Pause, End, Again, Done and Back — the product has exactly one rank, so its primary action is outranked by five repeated chips. Add `primaryButton` (Begin only): the only filled, only warm, only 17px element at idle. Static box-shadow on chrome, nothing animated.
- [x] **Layout: `grid min-h-[100svh] place-items-center`** with the hero as the only grid child. Furniture becomes `absolute inset-x-0 bottom-0` so `opacity-0 pointer-events-none aria-hidden` costs **zero layout** — this is the fix for the session-never-re-centers bug, and it also stops `invisible` from stripping focusable controls out of the tab order and the AX tree.
- [x] Spacing rhythm: 8/12/20 intra-group, 36 group-internal, ~88px+ between hero and furniture. Gestalt needs within-group spacing under half of between-group; every gap today is 32–40px, so proximity conveys nothing.
- [x] **Kill the `h-14` magic number**: the action slot becomes a 1×1 grid with each state at `[grid-area:1/1]`, so height is derived from the tallest payload and the four states crossfade in place instead of jump-cutting.
- [x] The slot is **never empty during a session** — when the HUD auto-hides it fades *to* an ambient line (`box breathing · cycle 4`) rather than out of existence
- [x] `screens: { short: { raw: '(max-height: 500px)' } }`; `short:flex-row short:gap-10` puts the word/HUD column beside the orb in landscape
- [ ] `✕` and `✎` → inline `<svg aria-hidden viewBox="0 0 24 24">`. U+270E renders as a colour emoji pencil on several Android builds and both glyphs sit off-centre. *(deferred to slice 19, which rebuilds the picker anyway)*
- [x] Verify: lint clean, 66/66 tests, build OK. Idle and session captured at 500–900px wide; the session composition stays anchored when the furniture fades and when the HUD auto-hides.
- [x] Landed early from slice 19: the pattern row's scroll container (`justify-start` + inner `mx-auto w-max` + edge mask). Centring a flex row that overflows puts its leading chips at a negative offset, and `scrollLeft` cannot go negative — so the first chips were permanently unreachable once the row was wider than the viewport.

> **Verification limit found the hard way.** Headless Chrome on this machine clamps its layout viewport to ~500 CSS px, so a `--window-size=390` capture is a 390-wide *crop of a 500-wide page*. That reads as a centred element sitting 54px right of centre, and I spent several rounds chasing it as a mobile layout bug before measuring across widths (390/450/500 all pinned the orb at x=249; 500/600/760 all centred to within 1px). **Real phone widths are unverified by this harness** — 375/390 need a device or a DevTools-protocol emulation pass. The changes made while chasing it (`grid-cols-[minmax(0,1fr)]`, `min-w-0`, `overflow-x-hidden`) are all correct practice and were kept; none of them was the fix, because there was nothing to fix.

> **DECIDED (see Decisions taken §3): `ui-serif`, nothing vendored.** Zero bytes on an offline-first PWA, and the upgrade path is reassigning one custom property, so it can be revisited without blocking anything. Accepted cost: Georgia has no light weight, so the phase word renders at 400 on Windows — check the `clamp()` size there (slice 24).

---

## Slice 18 — Session flow: a beginning, living holds, and an ending
Goal: the first ten seconds and the last ten seconds stop being the worst part of the product.

- [x] **Lead-in as a first-class engine state, not a component timer.** `createBreathEngine(pattern, { leadInSeconds })` gains `status: 'leading'` and exposes `leadRemaining`. Default 3s; **add `leadInSeconds?: number` to `BreathPattern` and set it to `0` on the physiological sigh** (see Decisions taken §2) — resolution order is pattern override → user setting → 3s default. `leadInSeconds: 0` must skip the state entirely, not run a zero-length one. The same `tick()` accumulator advances `leadElapsed`; crossing the threshold **carries the remainder into `phaseElapsed`** exactly as phase boundaries do, so there's no hitch — and it inherits the same drift test. `elapsed`, `cycles` and `phaseIndex` stay 0 throughout.
- [x] Lead-in visuals: body parked at min scale, fields ramping 0.70→0.80 so the room inhales before you do, word sequence `"Settle in"` → `"Breathe in, in 3 / 2 / 1"` from `Math.ceil(leadRemaining)`. The ring draws **one complete slow revolution** — the instrument winding up — using an element that already exists. Tapping the orb skips into the inhale. `Again` routes through it.
- [x] **Holds stop being a frozen frame** — three additive motions, none of which touches breath level: the counter-rotating caustics (always on), a sub-threshold shimmer during holds only (`0.85 + 0.05*sin(2π·0.55·tHold)`, amplitude ramped in over 400ms so it doesn't pop), and the τ=0.44 far field, which means the first ~1.2s of every hold carries residual drift **for free**. Holds begin by settling rather than stopping.
- [x] **Pause — the scene withdraws.** `data-status="paused"` drives a 500ms CSS `transition-opacity` (a state change, not a per-frame animation): fields × 0.35, inner light × 0.5, caustic rotation frozen. Once holds are alive, paused is the only genuinely motionless state, so it must be visibly *dimmer* or it reads as a hang. On resume, decay the follower refs toward the current target rather than snapping — today `followerRef` still holds the pre-pause level.
- [x] **Timed sessions get acknowledged.** Show **remaining**, not elapsed ("3:42 left") — elapsed is the number you stare at when you want it to be over. Add a 1px session-progress hairline at the bottom of the viewport at 15%, filling once via `transform: scaleX()` from the same snapshot. **Telegraph the ending** by dropping field peak ~4% per cycle over the last ~20s so the chime is expected. On crossing the limit, set a `finishing` flag and run to the **end of the current exhale** before chiming — the session always closes on an out-breath.
- [ ] **The close, not the receipt** (~3s, same clock): final exhale eases to min scale via the follower rather than snapping; the phase word crossfades to "That's it. Take a moment." with no numbers on screen; only then does the summary fade in — pattern name + time as the headline, floored and consistently formatted ("1 min 30", never `Math.round` turning 90s into "2 min"), cycles demoted or dropped. "32 cycles" quantifies the one thing in this product that should not be scored.
- [ ] Escape while running becomes a **soft** stop through the same sequence (or requires a second press within 2s). Today a mis-hit destroys the session instantly.
- [ ] **Interruption story:** record the wall-clock time at auto-pause. Under ~2 min, show a quiet resume line naming the cause and position; over ~2 min, route straight to the graceful close. Today a backgrounded tab returns to a frozen orb, which reads as a crash.
- [ ] Persistent `End` at a fixed corner resting at 28% opacity, never fully hidden. The product itself warns that 4-7-8 causes lightheadedness, and right now the stop button is invisible when that happens.
- [x] **A11y:** hand focus off explicitly at every state transition (Begin→Pause, End→Again, summary-dismissed→Begin) — today the swapping slot drops `activeElement` to `<body>` three times per session
- [x] Tests: lead-in remainder carry; no drift over 20 simulated minutes *with* lead-in; `finishing` runs to the exhale boundary; `formatSummary` floors rather than rounds
- [x] Verify: lint clean, 75/75 tests, build OK, and the dev server checked directly this time. Lead-in captured at 1.2s and 2.6s.
- [x] Engine tests added: lead-in counts down with phase state held at zero; the remainder carries into the first phase exactly like a boundary; `leadInSeconds: 0` skips the state rather than running a zero-length one; the sigh's pattern-level 0 reaches the engine; `skipLeadIn` jumps to the inhale; pausing mid-lead-in resumes *into* the lead-in; and 20 simulated minutes with a lead-in still lands on exactly 75 cycles with zero drift.
- [ ] *Still owed:* the graceful 3s close sequence (final exhale eases out, then a human line, then the summary) and the interruption/resume story. The timed close now lands on an out-breath and telegraphs itself, but the closing choreography is not built.
- [ ] *Still owed:* soft Escape (double-press or route through the close) and the persistent corner End.

> **DECISION NEEDED:** the lead-in changes `breathEngine`'s public API and makes PRD §1's "start breathing within 3 seconds of page load" literally 3 seconds later. *Recommendation: ship it, default 3s, with 5s and Off as real options.* Settling is part of starting, and the first cycle is otherwise always spent catching up — but this is a product call to make explicitly, not to discover in review.

---

## Slice 19 — Pattern discovery
Goal: the data that explains the patterns exists in `patterns.ts` and is rendered nowhere. Fix that, and fix a live scrolling bug.

- [x] Replace pills with five `text-ui` words in a `role="radiogroup"` with roving tabindex; selection marked by a 1px accent rule 8px beneath. Words are quieter than pills and stop the footer out-ranking the hero by repetition.
- [x] **Fix the unreachable-chips bug:** `justify-start` + inner `mx-auto w-max` (not `sm:justify-center`), `snap-x`, `[mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]` edge fade, and `scrollIntoView({ inline: 'nearest' })` on selection change. Today, once the row overflows, leading chips are permanently unreachable because `scrollLeft` cannot go negative.
- [x] 44px hit areas via `min-h-11 min-w-11 grid place-items-center` with the visible mark kept small
- [x] `aria-describedby` on each control carrying the tagline — currently the only route to it is a `title=` tooltip, invisible on touch
- [x] Lift "+ Build your own" **out of the radiogroup** — it's a mode switch, not a selection
- [x] Surface `tagline` and `cycleSuggestion` under the pattern title (from slice 17); move the 4-7-8 caution inline to where that pattern is selected
- [x] Drop the dashed border on "Custom…" — dashed is the convention for placeholder/disabled, not for an action
- [x] Verify: lint clean, 75/75 tests, build OK; captured at 900px.
- [x] Also fixed here: the onboarding dismiss was a 20x26px text `✕` — failing WCAG 2.5.8 and rendering as a colour emoji on some Android builds. Inline SVG with a 44px hit floor now, same treatment as the picker's edit control.
- [ ] *Still owed:* VoiceOver pass on the radiogroup, and a real-device check that the overflow row is reachable at 320px (the headless harness clamps to ~500 CSS px, so narrow widths are unverified).

---

## Slice 20 — Light theme as a designed mode
Goal: stop shipping the dark design into a light page.

- [x] Light environment tokens — **warm paper, not cool slate**: `--scene-top #fcfaf4`, `--scene-mid #f6f3ec`, `--scene-low #eae6dd`, `--scene-floor #e3ded3`, `--surface-raised #ffffff`, `--line #ddd8cf`. `#f1f5f9` is screen-blue and has no light direction; at noon the enemy is flatness, not brightness.
- [x] Light ink tokens: `--ink-strong #202128`, `--ink #41434b`, `--ink-muted #686c74`, `--ink-faint #888c96`, `--phase-word #666971`, `--countdown #828690`, `--focus #2f62ac`
- [x] **Inverted physics.** Glow is additive and cannot exist on paper — adding light to `#f7f4ed` produces nothing. The orb becomes a mid-tone mass (ink in water); the bloom becomes a **colored shadow** at `multiply`. `--glow-blend: multiply`, `--light-blend: soft-light`. Because `mix-blend-mode` accepts `var()`, `Pacer.tsx` needs **zero theme branching**.
- [x] Light accent cores at OKLCH L 0.62 so they clear 3:1 as a UI component (the orb is a button): box `#758999`, coherent `#6087c2`, 478 `#927aad`, calm `#639470`, sigh `#b67258`. Fields at 0.14–0.22 alpha.
- [x] **Light-mode light has a direction:** express the off-axis key as shade falling to the lower-right (`radial-gradient(ellipse 124% 82% at 70% 104%, …)` under `multiply`) rather than reusing the centered layer with the blend flipped. In daylight the direction cue is a shadow with a position — and it keeps light mode consistent with the body's own 38%/31% key.
- [x] Fix the sub-visibility chrome: ring track is currently 1.12:1, borders 1.36:1, countdown 1.89:1
- [x] Light-mode grain at 0.02 `multiply`, or none — paper doesn't need grain
- [x] Verify: every light token's ratio **recomputed and written back** — the direction's figures were against a different paper colour (#f7f4ed vs the shipped #fcfaf4) and every comment understated by 0.2–1.0. All pass: ink-muted 5.05:1 (AA body), ink-faint 3.23:1 (large/meta only), accent 3.47:1 (≥3:1 as a UI component), accent-strong 7.47:1, focus 5.81:1, countdown 3.49:1.
- [x] Verify: lint clean, 75/75 tests, build OK, dev server healthy; both themes captured and dark confirmed unchanged.
- [ ] *Still owed:* Lighthouse accessibility run on both routes in both themes.

---

## Slice 21 — Research page, editorial pass
Goal: the content is already the best thing in the product. Make the page worthy of it. **Claims and citations are locked to PRD §6 — restyle and restructure only, never restate.**

- [ ] **Sticky top bar replaces the floating pill**, which currently veils card text scrolling behind its translucent blur and sits in the thumb zone: `sticky top-0 z-20 -mx-6 px-6 py-3 bg-surface-base` with a `border-b border-line` hairline fading in on scroll
- [ ] Three-part section heads: `text-label` uppercase accent eyebrow → `h2` at `text-lede text-ink-strong` → `border-t border-line pt-8`. Rhythm for two utility classes.
- [ ] Cards become objects: `ring-1 ring-white/[0.06]` + a `bg-gradient-to-b from-white/[0.03]` top edge light. Today `night-soft` on `night` is 1.2:1 with no border at all.
- [ ] Card hierarchy inverts: claim → `font-display text-title font-light text-ink-strong`; "What they did —" / "What they found —" become their own `text-label` uppercase eyebrow lines (in dark mode they are currently the *identical color* as the body they label); body → `text-body` at `max-w-[34rem]` for ~66 chars
- [ ] **Design the counterpoint card.** The page's integrity is the third card admitting slow breathing didn't beat placebo, and it renders identically to the two supporting results. Add an optional `kicker?: string` to `StudyCard`, move the **verbatim** "The honest counterpoint" prefix into it, render as a bordered amber pill above the claim, and add a `border-l-2 border-l-amber-400/40` left rule. Re-typesetting only.
- [ ] Safety block gets a real container: `bg-surface-raised ring-1 ring-line border-l-2 border-l-rose-400/50 p-6`, bullets raised to `text-body`
- [ ] **Pull `CRISIS_LINE` out of the caution `<ul>`** into its own bordered-top callout with the 988 link at button weight, plus `tel:988` / `sms:988` affordances wrapped around the existing words. A suicide-prevention resource should not be the fourth `<li>` after "stop if you feel dizzy." **Wording untouched.**
- [ ] Add the two PRD §5 links the drawer is missing ("The science of slow breathing", "About / disclaimer")
- [ ] Verify: **diff `researchContent.ts` prose against PRD §6 word for word** — the only permitted change is the `kicker` extraction; reading-order and heading-level audit; skip link on both routes

---

## Slice 22 — Accessibility and mobile hardening
Goal: close the real defects the audit surfaced, not the cosmetic ones.

- [ ] `viewport-fit=cover` + `env(safe-area-inset-*)` on every fixed element — settings button, research bar, drawer. None exists today; the settings button at `top-5` and the research pill are both at risk on notched phones.
- [ ] `min-h-[100svh]` everywhere `min-h-screen` is used. `100vh` resolves to the *largest* viewport, so today the orb centers in a box 60–115px taller than what's visible and sits below true center with Begin under the address bar.
- [ ] `min-h-11 min-w-11` hit floor on all icon-only controls. The onboarding ✕ is 20×26px — failing WCAG 2.5.8 outright.
- [ ] Announce `${word}, ${seconds} seconds` so duration carries the pacing for non-visual users — today "Hold" alone gives them no way to pace while sighted users get a ring and a numeral. Key off `phaseIndex` so two consecutive holds in a custom pattern still fire.
- [ ] Add a **"Spoken phase cues" toggle**. 15 announcements/minute with no off switch is worse than useless once VoiceOver's polite queue lags.
- [ ] Expose the current pattern to assistive tech, and announce arrow-key switching (silent today)
- [ ] Drawer: scroll lock, `inert` background, overscroll containment, de-duplicate the label, don't land focus on Close
- [ ] Document the keyboard controls in the UI — space/esc/arrows appear nowhere. Key hint switches to `SPACE TO BEGIN · ← → PATTERN` on a `usedKeyboard` flag set at first Tab. Stop the arrow handler hijacking scroll.
- [ ] PWA manifest: `shortcuts` (physiological sigh as the panic-button entry from BACKLOG.md), `screenshots`, `orientation`, `id`; split `theme-color` into two `media`-qualified tags; `apple-mobile-web-app-status-bar-style: black-translucent`
- [ ] Verify: Lighthouse a11y 100 both routes both themes; VoiceOver walkthrough of a full session; real-device check on a notched phone in both orientations

---

## Slice 23 — Audio re-voicing
Goal: the loudest un-designed surface left in the product.

- [ ] **Kill the 0.12s 320Hz hold pip.** A sharp beep in an app whose thesis is calm.
- [ ] Enforce ≥200ms attack and release on every cue so there is no click (today: 40ms linear attack)
- [ ] Two slightly detuned sines through a lowpass, replacing the bare `sine` oscillator; ~300ms filtered-noise decay where a transient is wanted
- [ ] Don't construct an `AudioContext` at all while cues are off
- [ ] **Move the phase-tones toggle out of the drawer** onto the idle screen as one quiet icon. The default stays off; the problem is that nobody finds it two levels deep in Settings.
- [ ] Verify: play every cue at volume 0.2 / 0.6 / 1.0 through speakers and headphones; confirm no click at any volume; confirm no `AudioContext` in the performance trace with cues disabled

> **DECIDED (see Decisions taken §4): unbundled.** The re-voicing above ships regardless of defaults — the click is a bug, not a preference. Phase tones **stay off by default**, because a stress tool gets opened in open-plan offices and on trains. The fix to discoverability is placement, not the default.
>
> Deferred deliberately: a lowpass gain that follows the breath level. It makes the audio engine a second consumer of the clock — real scope, and not obviously worth it.

---

## Slice 24 — Profile, then cut
Goal: the perf claim is a hypothesis until it's a measurement.

- [ ] Profile raster + GPU time on real mid-range Android hardware, before/after. The claim is that this is *cheaper* than today, because it deletes two 64px `blur-3xl` filters that Chrome re-rasterizes whenever the animated scale drifts past its raster-scale tolerance (`-inset-10` + `will-change-transform` at DPR 2 pins ~1.8MB of texture plus separable blur intermediates). Blend modes cost a compositor pass, not a paint. That reasoning is sound and it is still not a measurement.
- [ ] **Profile `.body` first.** It carries `mask-image` + `overflow-hidden` + `isolate` with five blended children while its parent scales every frame — an isolated, masked render surface. It is the most likely single regression.
- [ ] **Pre-named cut list, in order:** `.bounce` (merge into the body gradient) → `.fieldFar` (fold into `.fieldNear`) → collapse `.caustic` into the `.grain` tile → drop the `.body` mask, keep the `.rim`. Deciding the order now prevents panic-cutting the wrong layer later.
- [ ] Check whether the caustic rotation is perceptible as *crawl* on an OLED phone at low brightness. Slow rotation interacting with a static overlay grain is exactly the thing that looks fine in theory and shimmers in practice. The counter-rotating pair is the hedge; if it still crawls, drop to 0.3°/s and lean on the hold shimmer.
- [ ] Check the `clamp()` display size on Windows, where Georgia has no light weight
- [ ] Verify: PRD §8 bars hold — Lighthouse ≥95 perf, ≥95 a11y, 100 best-practices on mobile; 60fps through phase transitions on real hardware; CLS 0; no console errors

---

## Deliberately not doing

| Rejected | Why |
|---|---|
| Abandoning navy for warm umber/sepia | PRD §4 names navy/charcoal. The near-neutral "moonlight" Box accent already delivers the restraint argument without a colour cast or a product-level approval. |
| Any `filter: blur()` in the pacer | The absolutist position is the reason this direction won. Every soft edge is authored into gradient stops. A static blur under an ancestor that scales every frame still re-rasterizes — managing that hazard is worse than deleting it. |
| Deleting the Begin pill; chips as bare words *with no anchor* | Ground truth already reports an unanchored idle page. The answer is one strong anchor, not zero. (The bare-word pattern *row* is kept — that's the footer, not the hero.) |
| Hairline-as-hero geometry (a 1.2px stroke as the whole orb) | Genuinely the most distinctive idea in the set, but a 1.2px stroke inside a node scaling 0.84→1.00 breathes ~1.0→1.2 device px and will crawl at DPR 1/1.5, with no fix that preserves the premise. |
| A vendored display font as a prerequisite | `ui-serif` gets ~70% of the win for zero bytes. Keeping the font question off the critical path means it can never block the orb work. |
| Breath-following lowpass on the audio | Makes the audio engine a second consumer of the clock. Real scope, unclear payoff. |
| Scaling any composited layer above 1.0 | Resamples a texture rasterized smaller and visibly softens the 1px rim and the ring — precisely the details this plan spends its budget on. |
| Streaks / history | Already deferred in BACKLOG.md, and it cuts against the "don't score the breath" principle in slice 18. |

---

## Sequencing at a glance

| Slice | Impact | Effort | Risk |
|---|---|---|---|
| 14 — Semantic token layer | None visible (unblocks everything) | M | Low — mechanical, screenshot-diffable |
| 15 — The lit orb | **Very high** | L | Med — needs the look-and-feel decision; Safari `mask-image`; perf unproven |
| 16 — The room | **High** | M | Low–Med — the cast-light ref crosses a component boundary |
| 17 — Type, buttons, composition | **High** | M | Low — fixes the session layout bug outright |
| 18 — Session flow | **High** | L | Med — touches the engine's public API and its test suite |
| 19 — Pattern discovery | Medium | S | Low — includes a live unreachable-chips bug fix |
| 20 — Light theme | Medium (high for daytime users) | M | Low once 14 has landed; structurally blocked without it |
| 21 — Research page | Medium | M | Low — content is locked, restyle only |
| 22 — A11y + mobile | Medium (high for affected users) | M | Low |
| 23 — Audio re-voicing | Low–Medium | S | Low |
| 24 — Profile, then cut | Protects 15 & 16 | S | — |

**Critical path:** 14 → 15 → 16. Shipping 15 without 14 leaves light mode *worse* than today, because a beautifully lit dark body makes the `#1a2238`-on-`#f1f5f9` void more conspicuous, not less. Everything from 17 onward is independently shippable in any order.
