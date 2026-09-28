# VERIFY.md — what still needs a human and a device

Everything in here is unverified. Not "probably fine" — **unverified**. I built
it, reasoned about it, and in some cases measured it, but I have never seen it
on a phone, heard it, or run a real profiler against it.

Live: **https://breathisart.vercel.app**

Each item says what to do, what a pass looks like, and what failure looks like
so you can report it precisely. Work top-down: the first three are the ones
most likely to find something.

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

## 3. Touch — is anything dead?

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

## 4. Audio — I have never heard it

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

## 5. Lighthouse

1. Desktop Chrome → open https://breathisart.vercel.app → DevTools → Lighthouse.
2. Mode: Navigation. Device: **Mobile**. Categories: Performance,
   Accessibility, Best Practices.
3. Run it on `/` and then on `/research`.
4. Switch the app to **Light** in Settings and run both again.

- **Target (PRD §8):** Performance ≥95, Accessibility ≥95, Best Practices 100.
- Send me the four scores and any failing audit names. Accessibility failures
  are the ones I most want.

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

## 8. OLED — does the surface crawl?

**Why it matters:** two layers inside the orb rotate at 0.55°/s and −0.31°/s so
holds aren't a frozen frame. I flagged at design time that this could read as
crawling rather than as life, and I can't judge it on this display.

1. In a dark room, phone brightness low, run box breathing.
2. Watch the orb during the 4-second holds.

- **Pass:** the surface feels alive but you can't point at anything moving.
- **Fail:** a visible drift or shimmer, like the texture is sliding. Say so and
  I'll halve the rate.

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
