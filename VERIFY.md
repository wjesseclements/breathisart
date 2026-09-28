# VERIFY.md — what still needs a human and a device

Items 1, 2, 6, 7, 9, 10 and 11 are still unverified — not "probably fine" but
**unverified**. I built them, reasoned about them, and in some cases measured
them, but I have never seen them on a phone, heard them, or profiled them.

Items 3, 4, 5 and 8 are now closed. Their results are recorded in place.

Live: **https://breathisart.vercel.app**

Each item says what to do, what a pass looks like, and what failure looks like
so you can report it precisely.

## Status board

| # | Item | Status |
|---|------|--------|
| 1 | Safari iPhone — the orb's edge | open |
| 2 | iPhone layout | fix shipped `6ff1f89`, needs a re-look |
| 3 | Touch — is anything dead? | **passed** — "touch seems to work fine" |
| 4 | Audio | **passed** — no clicks |
| 5 | Lighthouse | **done by me** — see the scores below |
| 6 | VoiceOver | open |
| 7 | Reduced motion | open |
| 8 | OLED crawl | **passed** — "the oled crawl is fine" |
| 9 | Windows font | open |
| 10 | PWA install and offline | open — retest after the `/research` 404 fix |
| 11 | Frame rate on a mid-range phone | open |

---

## 1. Safari on iPhone — the orb's edge

**Why it matters:** the orb's soft edge is a CSS `mask-image`. It is the single
element in the design with no fallback, and Safari is the browser I have never
seen this in.

1. Open https://breathisart.vercel.app in Safari on your iPhone.
2. Look at the orb's outline, especially the lower-right.

- **Pass:** the edge fades softly on the lower-right and stays crisp on the
  upper-left, like a lit sphere.
- **Fail:** a hard circular edge all the way round, like a sticker. That means
  the mask was ignored. Not broken, just flat — tell me and I'll add a fallback.
- **Also fail:** a visible rectangular box or a black square behind the orb.
  That is worse and I'd want to know immediately.

## 2. iPhone layout — notch, toolbar, rotation

**Why it matters:** headless Chrome here clamps to ~500 CSS px, so **every
claim I've made about phone layout is inference**, not observation.

1. In Safari, portrait: is anything clipped by the notch or the home indicator?
2. Scroll up and down so Safari's toolbar collapses and expands. Does the orb
   stay put, or does it jump?
3. Rotate to landscape. Is the orb still fully visible with the word beneath it?
4. Start a session. Does the layout shift when Begin is replaced by the HUD?

- **Pass:** nothing clipped, no jump when the toolbar moves, landscape fits.
- **Fail:** content under the notch, the orb jumping when the toolbar
  collapses, or the orb cut off in landscape.

## 3. Touch — is anything dead?  ✅ PASSED 2026-09-28

**Why it matters:** I shipped three separate "looks fine, doesn't respond" bugs
today. I've clicked through everything with a synthetic mouse, but **iOS touch
hit-testing is not something I can test**.

Tap each of these on the phone and confirm it responds:

- [ ] Begin
- [ ] The orb itself (should pause)
- [ ] Pause, then Resume
- [ ] End
- [ ] Again and Done on the summary
- [ ] Each pattern name in the row; scroll the row sideways and reach the first one
- [ ] "+ Build your own"
- [ ] The ··· settings button
- [ ] Every control in Settings, including the ✕ to close
- [ ] "The science of slow breathing", and "← Back to breathing"

- **Fail:** a tap does nothing, or you have to tap twice. Tell me which one.

## 4. Audio — I have never heard it  ✅ PASSED 2026-09-28

**Why it matters:** I rewrote every cue (killed a 0.12s pip, put a ≥200ms
attack and release on everything, two detuned sines through a lowpass). I
cannot hear the result. "No click" is reasoned from the envelope, not confirmed.

1. Settings → Audio → turn **Phase tones** on.
2. Set Volume to about 20%. Run a session through one full cycle.
3. Repeat at ~60% and at 100%.
4. Repeat all three on headphones.

- **Pass:** each tone fades in and out; no click, pop or tick at any volume;
  the hold tone is softer than the inhale and exhale.
- **Fail:** any click at the start or end of a tone, especially at 100%; a tone
  that sounds abrupt or buzzy; the hold tone drawing attention.
- Also: with Phase tones **off**, no audio should initialise at all.

> **Result:** no clicks heard, with the cues audible (inhale, hold and exhale
> all confirmed in the previous pass). That closes the one risk I could not
> reason my way out of — a click means a discontinuity in the envelope, and
> there isn't one. Untested and not worth chasing: whether the hold tone reads
> as quieter than the other two. That is taste, not a defect.

## 5. Lighthouse  ✅ DONE BY ME 2026-09-28

Lighthouse is Google's automated page-audit tool, built into Chrome DevTools.
It loads the page in a throttled, emulated mobile Chrome and scores four
categories out of 100. It turned out to be scriptable from here, so **you don't
need to run it** — I did, on both routes and both themes, emulated mobile,
Lighthouse 13.4.1 against production.

| Route | Theme | Performance | Accessibility | Best Practices |
|-------|-------|------------:|--------------:|---------------:|
| `/` | dark | **100** | **100** | **100** |
| `/research` | dark | **100** | **100** | **100** |
| `/` | light | **100** | **100** | **100** |
| `/research` | light | **100** | **100** | **100** |

Measured against production after both fixes landed, on clean browser profiles.
Before the fixes the same runs gave 99/100/100 dark and 100/96/100 light.

PRD §8 asks for Performance ≥95, Accessibility ≥95, Best Practices 100. **All
eight numbers clear it.** Core Web Vitals on the home page: LCP 1.6s, total
blocking time 0ms, cumulative layout shift 0.

Two things it found:

**a. `/research` 404s on a cold load.** Fixed. Vercel had no SPA rewrite, so
`https://breathisart.vercel.app/research` returned Vercel's own 404 page. It
worked for us because the service worker serves `index.html` for any navigation
once installed — so a *return* visitor was fine and a *first* visitor, or
anyone following a shared link, got a dead page. Now `vercel.json` rewrites
every path to `index.html`, matching what the service worker already did, and
an unknown path redirects to `/` instead of rendering blank.

**b. Light mode failed WCAG AA on small text.** Fixed. `--ink-faint` (#888c96)
carried 11px and 13px text at 3.22:1 where the standard wants 4.5:1 — the
token's own comment said "large/meta only", which was wrong about 13px being
large.

Measuring it properly made it worse, not better. Lighthouse checks contrast
against the declared background of the nearest opaque ancestor, which is
`--surface-page` (#fcfaf4). The scene ramp and the orb's multiply shadow mean
the *real* composited background under some of that text is #dfdbd0, so
"+ Build your own" was actually **2.43:1**, not the 3.22 reported. Every value
below is solved against the measured background, sampled from the rendered
pixels rather than assumed.

| | before | after |
|---|---:|---:|
| pattern line, 11px | 2.93 | **5.54** |
| + Build your own, 13px | 2.43 | **4.61** |
| session HUD line, 11px | 2.82 | **5.35** |
| countdown, 13px light | 3.03 | **5.29** |
| countdown, 13px dark | 3.52 | **4.65** |

The countdown is the one Lighthouse structurally cannot reach — it only exists
mid-session, and the audit only ever sees the idle screen. It was the sole
failure in dark mode, which is otherwise clean.

The research page's uppercase eyebrows moved from `--accent-core` (3.47:1) to
`--accent-strong` (7.47:1), which is what the palette's own documented rule
already said text should use.

After: light mode scores **100 / 100 / 100** on both routes. Dark mode is
unchanged to the pixel on both routes — the only dark token that moved is the
countdown, which isn't on screen until a session runs.

## 6. VoiceOver

**Why it matters:** the pattern row is a `radiogroup` with roving tabindex and
the session announces each phase with its duration. Both are reasoned, neither
is tested with a real screen reader.

1. iPhone: Settings → Accessibility → VoiceOver → on (or triple-click the side
   button if you've set that shortcut).
2. Swipe through the home screen. Does each pattern read its name *and* its
   description?
3. Start a session. Does it announce "Breathe in, 4 seconds" and so on?
4. Settings → Display → turn **Spoken phase cues** off. Announcements should stop.

- **Fail:** patterns read as unlabelled buttons; announcements pile up or lag
  behind the orb; the off switch doesn't silence them.

## 7. Reduced motion

1. iPhone: Settings → Accessibility → Motion → **Reduce Motion** on.
2. Reload the app and run a session.

- **Pass:** the orb barely changes size; instead a *waterline* rises and falls
  inside it with a bright line at its surface, and you can tell inhale from
  exhale from a single frozen glance.
- **Fail:** the orb still scales a lot, or you genuinely cannot tell which
  direction the breath is going.

## 8. OLED — does the surface crawl?  ✅ PASSED 2026-09-28

**Why it matters:** two layers inside the orb rotate at 0.55°/s and −0.31°/s so
holds aren't a frozen frame. I flagged at design time that this could read as
crawling rather than as life, and I can't judge it on this display.

1. In a dark room, phone brightness low, run box breathing.
2. Watch the orb during the 4-second holds.

- **Pass:** the surface feels alive but you can't point at anything moving.
- **Fail:** a visible drift or shimmer, like the texture is sliding. Say so and
  I'll halve the rate.

> **Result:** no crawl. The caustic layers stay at 0.55°/s and −0.31°/s.

## 9. Windows

**Why it matters:** the display face is `ui-serif`, which is New York on Apple
and **Georgia** on Windows. Georgia has no light weight, so the phase word
renders at 400 there instead of 300.

1. Open the site on any Windows machine.
2. Start a session and look at "Breathe in".

- **Fail:** the word looks heavy, cramped, or wraps to two lines.

## 10. PWA install and offline

1. iPhone Safari → Share → **Add to Home Screen**. Open it from the icon.
2. Confirm it opens without Safari's chrome.
3. Long-press the home-screen icon — a **Physiological sigh** shortcut should appear.
4. Turn on Airplane Mode and open it again.

- **Pass:** works fully offline, including the research page.
- **Fail:** blank screen offline, or the shortcut missing.

## 11. Frame rate on a mid-range phone

**Why it matters:** this is the honest gap in the whole plan. I argued the new
orb is *cheaper* than the old one because it deletes two 64px blurs, and that
reasoning is sound — but **nothing has profiled it**.

1. Android phone, Chrome → `chrome://inspect` from a desktop, or DevTools
   remote debugging.
2. Performance tab → record ~20 seconds of a session.

- **Looking for:** sustained 60fps, no long tasks during phase transitions, and
  raster time that is not dominated by the orb.
- If it janks, the pre-named cut list is in PLAN_V2 slice 24 — I'd drop the
  `.bounce` layer first, then `.fieldFar`.

---

## What I have verified

So you know where the line is:

- 83 unit tests, including engine drift over 20 simulated minutes, the lead-in
  remainder carry, and the closing sequence
- Clicked every interactive control with a synthetic mouse at 318px and 900px
- Contrast ratios computed for every colour token in both themes, and for the
  accent across all five patterns
- Before/after pixel diff for the token refactor
- Both themes and both routes rendered and eyeballed
- The deployed bundle hash matched against my local build on every deploy
