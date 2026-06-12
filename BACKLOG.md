# Backlog — v1.5 and beyond

Documented per PRD §7; **not built in v1** by design. Each item should ship as its own slice with the same quality bar (tests, reduced-motion, a11y, offline).

- **Streaks / history** — session log in localStorage only (no backend): days practiced, total minutes, gentle streak display. Must stay non-guilt-inducing — a calming tool shouldn't nag.
- **Ambient soundscapes** — optional synthesized or generative background audio (rain, drone). Keep WebAudio-only if feasible; revisit the no-audio-files rule if not.
- **Richer haptic patterns** — Apple Watch-style breathing taps where supported (Vibration API patterns on Android; iOS Safari has no vibration support).
- **Multi-language** — i18n for UI strings and the research page; phase words ("Breathe in") are the priority surface.
- **Panic button** — PWA shortcut (`shortcuts` in the manifest) that launches the physiological sigh instantly from the home-screen icon.
- **Starfield / aurora background toggle** — stretch visual from PRD §4, explicitly not v1.
