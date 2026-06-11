import type { RefObject } from 'react';

/**
 * Thin per-phase progress ring around the orb. The sweep is driven from
 * the single rAF loop via strokeDashoffset on the referenced circle
 * (pathLength is normalized to 100). Under reduced motion this ring and
 * the phase word carry the pacing.
 *
 * The SVG fills an explicitly-sized wrapper div: absolutely positioning
 * the SVG itself via inset leaves its size unreliable in Safari.
 */
export function ProgressRing({
  circleRef,
  visible,
  colorClass,
}: {
  circleRef: RefObject<SVGCircleElement>;
  visible: boolean;
  colorClass: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute -inset-3 -rotate-90 transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${colorClass}`}
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full">
        <circle
          cx="50"
          cy="50"
          r="48.5"
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth="1"
        />
        <circle
          ref={circleRef}
          cx="50"
          cy="50"
          r="48.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset="100"
          className="opacity-70"
        />
      </svg>
    </div>
  );
}
