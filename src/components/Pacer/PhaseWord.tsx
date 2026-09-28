import { useState } from 'react';

interface PhaseWordProps {
  text: string;
  /** Seconds left in this phase, or null to hide the numeral. */
  countdown: number | null;
  /** Hard-swaps instead of crossfading, and stops any double-image. */
  reducedMotion: boolean;
}

/**
 * The phase word, and the countdown beside it.
 *
 * Two changes from the original (PLAN_V2 slice 17):
 *
 * 1. **It no longer doubles as the pattern title.** One 48px slot used to
 *    carry both "Box Breathing" (13 chars, an identifier read once) and "In"
 *    (2 chars, an instruction read peripherally 40 times). That is why the
 *    idle title was too big to be a label and too small to be a hero, and why
 *    session start read as a glitch. `PatternTitle` handles idle now.
 * 2. **The crossfade stops overlapping.** 200ms out, then 200ms in. The old
 *    600ms overlap left two strings superimposed at readable opacities for
 *    roughly 15% of a box session.
 *
 * The countdown moved here from inside the orb, where it measured ~1.2:1
 * against the accent and planted a high-frequency focal point in the exact
 * spot the product asks you to unfocus.
 */
export function PhaseWord({ text, countdown, reducedMotion }: PhaseWordProps) {
  const [shown, setShown] = useState<{ text: string; prev: string | null }>({ text, prev: null });
  // Render-phase state adjustment (React's documented pattern for tracking the
  // previous value of a prop).
  if (shown.text !== text) {
    setShown({ text, prev: reducedMotion ? null : shown.text });
  }

  // Long custom labels step down so they stay on one line.
  const size = text.length > 6 ? 'text-title' : 'text-display';
  const wordClass = `absolute inset-x-0 font-display ${size} font-light text-ink-display`;

  return (
    <div
      className="relative flex h-[1.15em] w-full items-baseline justify-center"
      aria-hidden="true"
    >
      <div className="relative w-full text-center">
        {shown.prev !== null && (
          <span key={`${shown.prev}->${shown.text}`} className={`${wordClass} animate-word-out`}>
            {shown.prev}
          </span>
        )}
        <span
          key={shown.text}
          className={reducedMotion ? wordClass : `${wordClass} animate-word-in`}
        >
          {shown.text}
          {countdown !== null && (
            <span className="ml-3 align-baseline text-title tabular-nums text-countdown">
              {countdown}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
