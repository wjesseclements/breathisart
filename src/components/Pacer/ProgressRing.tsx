import type { RefObject } from 'react';

/**
 * Per-phase progress ring. The sweep is driven from the single rAF loop via
 * `strokeDashoffset` on the referenced circle (`pathLength` normalized to 100).
 *
 * Two changes from the original (PLAN_V2 slice 15):
 *
 * 1. **The sweep carries direction.** The arc grows while you fill or hold and
 *    retreats while you empty — `dashoffset = exhale ? 100*t : 100*(1-t)`. As
 *    a side effect the exhale→hold boundary becomes continuous (the arc is at
 *    zero on both sides), so fewer discontinuities need the fade to cover them.
 * 2. **It stops reading as a gauge.** Pushed out to `-inset-6`, stroke down to
 *    0.52 units (~1.66px), and butt-capped — round caps at this weight read as
 *    a loading spinner. The gap to the orb now swings 1.98x over a breath
 *    rather than 7x.
 */
export function ProgressRing({
  circleRef,
  visible,
}: {
  circleRef: RefObject<SVGCircleElement>;
  visible: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute -inset-6 -rotate-90 transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full">
        <defs>
          {/* Static: a bright leading end fading to a dim tail. */}
          <linearGradient id="pacer-sweep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent-core))" stopOpacity="1" />
            <stop offset="100%" stopColor="rgb(var(--accent-core))" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        {/* Ink, not --line: the track crosses the orb's bloom, and a surface
            color darker than the bloom reads as a scratch across it. A faint
            ink hairline stays additive over both the navy and the glow. */}
        <circle
          cx="50"
          cy="50"
          r="48.5"
          fill="none"
          stroke="rgb(var(--ink-faint) / 0.16)"
          strokeWidth="0.52"
        />
        <circle
          ref={circleRef}
          cx="50"
          cy="50"
          r="48.5"
          fill="none"
          stroke="url(#pacer-sweep)"
          strokeWidth="0.52"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset="100"
        />
      </svg>
    </div>
  );
}
