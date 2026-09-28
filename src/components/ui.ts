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

/** Shared pill-button styling for session controls. */
export const pillButton = `rounded-full border border-line px-6 py-2 text-sm tracking-wide text-ink transition-colors hover:border-accent ${focusRingOffset4}`;
