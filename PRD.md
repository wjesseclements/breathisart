# Product Requirements Document — "Stillpoint" (working name)

A breath-pacing web app. Visitors land on a full-screen animated pacer, pick a breathing pattern, and breathe along. A small menu opens settings (custom patterns, audio, theme) and links to a research page summarizing the evidence for breathwork.

**Status:** v1.0 spec, ready for implementation
**Owner:** Jesse
**Builder:** Claude Code

---

## 1. Goals & Non-Goals

### Goals
- A visitor with zero instructions can start breathing along within 3 seconds of page load.
- The pacer visual is the product. It must feel calm, smooth (60fps), and premium.
- Support the well-known evidence-backed protocols out of the box, plus fully custom patterns.
- Educate: an honest, citation-backed research page (no wellness hype).
- Fast, free to host, works offline, works great on a phone.

### Non-Goals (v1)
- No accounts, no backend, no analytics requiring consent banners.
- No native apps (PWA covers mobile).
- No guided audio meditations / voiceovers.
- No health claims beyond what the cited research supports.

---

## 2. Tech Stack & Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | Vite + React 18 + TypeScript | Fast dev loop, Claude Code works very well with it |
| Styling | Tailwind CSS | Rapid iteration, consistent design tokens |
| Animation | Framer Motion for UI transitions; **requestAnimationFrame + SVG/CSS transforms for the pacer itself** | The pacer must be driven by a single rAF clock, not chained CSS animations, so phases never drift |
| State | Zustand (or React context if simpler) | Tiny, no boilerplate |
| Persistence | localStorage | Custom patterns, settings, last-used pattern |
| Routing | React Router (two routes: `/` and `/research`) | Minimal |
| PWA | vite-plugin-pwa | Offline support, installable |
| Hosting | Vercel (default) or AWS S3 + CloudFront (alternative — see §9) | Static export, free tier |

**No backend. The entire app is a static bundle.**

### Project structure (target)
```
src/
  components/
    Pacer/            # the animated visual + phase engine
    PatternPicker/    # horizontal chips / bottom sheet
    SettingsDrawer/   # slide-in menu
    SessionHUD/       # elapsed time, cycle count, end-session
  engine/
    breathEngine.ts   # rAF clock, phase state machine
    patterns.ts       # built-in pattern definitions + schema
    audio.ts          # WebAudio cue synthesis
  pages/
    Home.tsx
    Research.tsx
  store/
    useSettings.ts
public/
  manifest, icons
```

---

## 3. The Breath Engine (core logic)

### Pattern schema
A pattern is an **ordered array of phases**, not fixed inhale/hold/exhale/hold fields. This is required because the physiological sigh has two inhales, and future patterns may have arbitrary structures.

```ts
type PhaseKind = "inhale" | "hold" | "exhale";

interface Phase {
  kind: PhaseKind;
  seconds: number;        // 0.5–60, supports decimals (5.5s coherent breathing)
  label?: string;         // override, e.g. "Second sip" for sigh top-off
}

interface BreathPattern {
  id: string;
  name: string;
  tagline: string;        // one-line description shown in picker
  phases: Phase[];
  cycleSuggestion?: string; // e.g. "Try 5 minutes"
  builtIn: boolean;
}
```

### Built-in patterns
| Name | Phases | Notes |
|---|---|---|
| **Box Breathing** | in 4 → hold 4 → out 4 → hold 4 | Classic Navy SEAL pattern |
| **4-7-8 (Relaxing Breath)** | in 4 → hold 7 → out 8 | Dr. Weil's protocol; show a first-time tip that mild lightheadedness is common, start with 2–4 cycles |
| **Coherent Breathing** | in 5.5 → out 5.5 | ~5.5 breaths/min, HRV-oriented |
| **Extended Exhale (Calm)** | in 4 → out 6 | Gentle starter; exhale-emphasis |
| **Physiological Sigh** | in 3 → in 1.5 (label "Top-off sip") → out 6 | Double inhale through nose, long exhale through mouth |
| **Custom…** | user-defined | Opens pattern builder |

### Engine rules
- One `requestAnimationFrame` loop owns time. Each frame computes `elapsedInPhase / phase.seconds` → progress `t ∈ [0,1]` and hands it to the renderer. Never use `setTimeout` chains or CSS `animation-duration` sequencing for phase timing.
- Phase transitions fire exactly when accumulated time crosses the boundary (carry remainder into next phase so long sessions don't drift).
- Pause/resume must freeze and restore phase progress exactly.
- Track and expose: elapsed session time, completed cycles, current phase, current `t`.
- Use the **Screen Wake Lock API** during an active session (with feature detection) so phones don't sleep mid-breath.
- Handle `visibilitychange`: when the tab is backgrounded, pause the visual but keep the clock honest on return (or auto-pause the session — auto-pause is the v1 behavior).

---

## 4. The Pacer Visual (hero of the app)

### Concept
A centered orb/ring that **expands on inhale, holds steady (with a subtle shimmer or slow rotation) on hold, and contracts on exhale**. Surrounding it:
- A thin **progress ring** that sweeps once per phase (shows exactly how much of this phase remains).
- The phase word ("Breathe in", "Hold", "Breathe out") cross-fading in large, low-contrast type.
- A subtle countdown number (optional, toggleable — some users find numbers stressful).

### Motion quality requirements
- Scale the orb with an **easing curve that mimics breath**: ease-in-out sinusoidal (`0.5 - 0.5*cos(πt)`), not linear and not springy. Inhale and exhale should feel organic, never mechanical.
- Animate **only `transform` and `opacity`** (GPU-composited). No layout-triggering properties. Target 60fps on a mid-range phone.
- Layered depth: soft radial gradient orb + 2–3 blurred halo layers expanding at slightly different rates (parallax breathing effect).
- Idle state (before pressing start): the orb drifts in a very slow ambient float so the page never feels dead.
- **`prefers-reduced-motion`**: replace scaling with a gentle opacity/color crossfade and rely on the progress ring + text. This is mandatory, not nice-to-have.

### Aesthetic direction
- Dark-first design: deep navy/charcoal background, orb in a soft gradient (teal→indigo, or a per-pattern accent hue). Light theme available.
- Generous whitespace, one display typeface for the phase word (e.g., a humanist sans at light weight), everything else quiet.
- Background: a barely-perceptible animated gradient or grain so the scene feels alive. Optional starfield/aurora toggle is a stretch goal, not v1.

---

## 5. UX Flows

### Home (`/`)
1. Load → pacer idle, last-used pattern preloaded (localStorage), single prominent "Begin" affordance (tapping the orb itself also starts).
2. Pattern chips (horizontally scrollable on mobile) directly under the orb: Box, 4-7-8, Coherent, Calm, Sigh, Custom.
3. During session: chips fade away, a minimal HUD appears (elapsed time, cycle count, pause, end). Tap anywhere to reveal controls if hidden.
4. End session → gentle summary ("6 min · 32 cycles") with "Again" and "Done".

### Settings drawer (hamburger or "···" icon, top corner, low-contrast)
- **Custom patterns**: builder UI — add/remove/reorder phases, set kind + seconds (steppers + direct input), live mini-preview of the orb running the pattern, name it, save. Saved patterns appear in the picker with an edit/delete affordance.
- **Session length**: open-ended (default), or timed (3/5/10 min or custom) with a soft chime at completion.
- **Audio cues**: off (default) / soft tones. Synthesize with WebAudio (rising tone on inhale start, falling on exhale start, soft tick on hold) — no audio files needed. Volume slider.
- **Haptics** (mobile, where supported): gentle vibration pulse at phase changes via `navigator.vibrate`.
- **Visual options**: show/hide countdown numbers, theme (dark/light/system), reduced-motion override.
- **Link: "The science of slow breathing" → `/research`**
- **Link: About / disclaimer**

### Research page (`/research`)
Long-form, readable (max-width ~65ch), same visual language. Content in §6. Each summary card: claim → what the study actually did → what it found → citation link. A back-to-breathing button floats persistently.

---

## 6. Research Page Content (write this content, with these citations)

Tone: honest and specific. Lead with what's well-supported, flag what's preliminary. No curing claims.

### 6.1 The headline evidence
- **Breathwork reduces self-reported stress, anxiety, and depressive symptoms (meta-analysis).** Fincham et al. 2023, *Scientific Reports* — meta-analysis of randomized controlled trials found small-to-medium effects favoring breathwork vs. controls: stress g ≈ −0.35, anxiety g ≈ −0.32, depressive symptoms g ≈ −0.40. Authors caution that many included studies carried moderate risk of bias and urge against overhyping. https://www.nature.com/articles/s41598-022-27247-y
- **Five minutes a day of structured breathing improved mood and lowered resting respiratory rate (RCT).** Balban et al. 2023, *Cell Reports Medicine* — ~110 participants randomized to 5 min/day of cyclic sighing, box breathing, cyclic hyperventilation, or mindfulness meditation for one month. All groups improved; controlled-breathing groups improved mood more than meditation, and **exhale-emphasized cyclic sighing performed best**, including a reduction in resting respiratory rate. https://doi.org/10.1016/j.xcrm.2022.100895
- **Honest counterpoint to include:** a 2023 placebo-controlled RCT of coherent breathing (~5.5 breaths/min vs. a 12 breaths/min placebo, ~400 participants) found both groups improved with **no significant difference between them** — evidence that expectation and ritual contribute, and that the field still needs better-controlled trials. Fincham et al. 2023, *Scientific Reports*. https://www.nature.com/articles/s41598-023-49279-8

### 6.2 Mechanism section ("Why slowing the breath does anything at all")
Cover, in plain language, with the caveat that mechanisms are better established than some clinical claims:
- Slow breathing (~5–6 breaths/min) increases heart-rate variability and engages the parasympathetic ("rest and digest") system via vagal pathways; long exhales in particular slow heart rate (respiratory sinus arrhythmia).
- The double-inhale of a physiological sigh reinflates collapsed alveoli and offloads CO₂ efficiently, which is part of why a long sigh is the body's built-in reset.
- Breathing is unusual: it's the one autonomic process we can directly steer, which makes it a lever on a system that's otherwise hard to reach.

### 6.3 Per-technique notes
- **Box breathing:** widely used for acute composure (popularized via military use); performed comparably to other structured techniques in the Stanford RCT.
- **4-7-8:** popularized by Dr. Andrew Weil for relaxation/sleep onset; direct trial evidence is thinner than for slow breathing generally — present it as a slow-breathing variant with strong anecdotal adoption. Note the lightheadedness caution for beginners.
- **Coherent breathing (~5.5/min):** the standard protocol in HRV research; see the mixed placebo-controlled result above.
- **Physiological sigh:** best single-session evidence for fast mood shift (Balban 2023).

### 6.4 Safety & disclaimer block (must ship)
- This site is an educational pacing tool, not medical advice, and is not a treatment for anxiety disorders, depression, or any condition.
- Stop if dizzy or lightheaded; breath holds and long exhales can cause lightheadedness, especially standing.
- People who are pregnant or have cardiovascular, respiratory, or panic-related conditions should check with a clinician before breath-hold practices.
- If you're in crisis, seek professional help (link 988 in the US).

---

## 7. Additional features (the "anything else" list)

**In v1:**
- PWA / offline (the whole point of a calming tool is it works on a plane).
- Keyboard accessible: space = start/pause, esc = end, arrow keys cycle patterns. Full ARIA labeling; announce phase changes via a polite `aria-live` region for screen-reader users.
- Shareable pattern URLs: encode a custom pattern in the query string (`/?p=in4-h7-out8`) so users can share patterns without a backend.
- First-visit micro-onboarding: one dismissible line — "Follow the orb. In as it grows, out as it settles."
- Open Graph/meta tags + favicon set so shared links look polished.

**v1.5 / backlog (document in repo, don't build yet):**
- Streak/history (localStorage only), ambient soundscapes, Apple Watch-style haptic patterns, multi-language, a "panic button" preset that launches physiological sigh instantly from the home screen icon (PWA shortcut).

---

## 8. Quality bars / acceptance criteria

- Lighthouse: ≥95 performance, ≥95 accessibility, 100 best-practices on mobile.
- Pacer holds 60fps on a mid-range Android (no main-thread jank during phase transitions).
- Zero timing drift over a 20-minute session (assert in a unit test on the engine's accumulator logic).
- Engine has unit tests (Vitest): phase sequencing, pause/resume restoration, remainder carry, custom pattern validation (reject 0s phases, cap at 60s).
- Works with JS-driven reduced-motion mode; verify with OS-level setting.
- No console errors; no layout shift on load (CLS ~0).

---

## 9. Deployment

**Default: Vercel.** Connect the GitHub repo → framework preset "Vite" → every push to `main` deploys; PRs get preview URLs. Zero config beyond build command `npm run build`, output `dist/`.

**Alternative (AWS-native):** S3 static hosting + CloudFront + ACM cert + Route 53, deployed via a GitHub Actions workflow (`aws s3 sync dist/ s3://bucket --delete` + CloudFront invalidation) with OIDC role assumption instead of long-lived keys. More moving parts; choose it if you want the project on your own AWS account.

Either way: custom domain, HTTPS enforced, immutable cache headers on hashed assets, short cache on `index.html`.
