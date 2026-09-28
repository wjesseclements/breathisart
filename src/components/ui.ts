/**
 * Shared control styling.
 *
 * The focus ring used to be a 130-character literal pasted into 12 files with
 * three different offsets. It lives here now; the offset variants exist so the
 * sweep in PLAN_V2 slice 14 could preserve each call site's exact geometry.
 */
const FOCUS_BASE = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus';

/** Flush against the control's own edge. */
export const focusRing = FOCUS_BASE;
/** Chips and other controls sitting in a dense row. */
export const focusRingOffset2 = `${FOCUS_BASE} focus-visible:outline-offset-2`;
/** Pills and standalone links. */
export const focusRingOffset4 = `${FOCUS_BASE} focus-visible:outline-offset-4`;
/** The orb, which needs the ring clear of its halo. */
export const focusRingOffset8 = `${FOCUS_BASE} focus-visible:outline-offset-8`;

/**
 * Inline links.
 *
 * Always underlined, never underline-on-hover. Once chrome started following
 * the pattern accent, the near-neutral "moonlight" default put link colour at
 * 1.27:1 against body ink in light mode — indistinguishable. WCAG 1.4.1 wants
 * 3:1 when colour is the only cue, and hover is not a cue that exists on
 * touch. An underline is the one signal that survives every accent and both
 * themes.
 */
export const linkText = `text-accent-strong underline decoration-[rgb(var(--accent-strong)/0.35)] underline-offset-4 transition-colors hover:decoration-[rgb(var(--accent-strong))] ${focusRingOffset4}`;

/**
 * Secondary rank: Pause, End, Again, Done, Back.
 *
 * There used to be exactly ONE button rank, shared by every control including
 * Begin — which is why the product's primary action was outranked by five
 * repeated pattern chips sitting below it.
 */
export const pillButton = `rounded-full border border-line px-6 py-2 text-meta tracking-wide text-ink transition-colors hover:border-line-strong ${focusRingOffset4}`;

/**
 * Primary rank: Begin, and nothing else. The only filled, only warm, only
 * 17px element on the idle screen — which is all the hierarchy it needs.
 * Static box-shadow on chrome, never on the pacer, and nothing animated.
 *
 * Uses `--accent-core`, the PATTERN accent, not the legacy `--accent` teal:
 * the button sits directly under the orb, so a teal CTA beneath a moonlight
 * orb reads as two unrelated palettes.
 */
export const primaryButton = `rounded-full border border-[rgb(var(--accent-core)/0.40)] bg-[rgb(var(--accent-core)/0.14)] px-9 py-3.5 text-body font-medium text-ink-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_48px_-14px_rgb(var(--accent-core)/0.5)] transition-colors hover:bg-[rgb(var(--accent-core)/0.22)] ${focusRingOffset4}`;
