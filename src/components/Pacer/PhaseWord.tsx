import { useState } from 'react';

interface PhaseWordProps {
  text: string;
  /**
   * Type size for the whole session, chosen once from the pattern's longest
   * word — never from the word currently showing.
   */
  sizeClass: string;
  /** Seconds left in this phase, or null to hide the numeral. */
  countdown: number | null;
  /** Hard-swaps instead of crossfading, and stops any double-image. */
  reducedMotion: boolean;
}

/**
 * The phase word, and the countdown beside it.
 *
 * The size is a prop rather than a function of `text`. It used to be
 * `text.length > 6 ? title : display`, which was meant to step down long
 * custom labels — but "Hold" is 4 characters and "Breathe in" is 10, so the
 * built-in patterns hit both branches and the word resized on *every single
 * phase transition*. One size per session is the only stable answer.
 *
 * The size also lives on the container, not just the span: `h-[1.15em]`
 * resolves `em` against the inherited font size, so with the size only on the
 * child the box was ~18px tall while the text was up to 68px. It overflowed,
 * and everything underneath sat far too close to it.
 */
export function PhaseWord({ text, sizeClass, countdown, reducedMotion }: PhaseWordProps) {
  const [shown, setShown] = useState<{ text: string; prev: string | null }>({ text, prev: null });
  // Render-phase state adjustment (React's documented pattern for tracking the
  // previous value of a prop).
  if (shown.text !== text) {
    setShown({ text, prev: reducedMotion ? null : shown.text });
  }

  // `whitespace-nowrap`: a wrapped phase word overflows its 1.15em box and
  // collides with whatever sits beneath it.
  const wordClass =
    'absolute inset-x-0 whitespace-nowrap font-display font-light leading-none text-ink-display';

  return (
    <div
      aria-hidden="true"
      className={`relative h-[1.15em] w-full text-center ${sizeClass} leading-none`}
    >
      {shown.prev !== null && (
        <span key={`${shown.prev}->${shown.text}`} className={`${wordClass} animate-word-out`}>
          {shown.prev}
        </span>
      )}
      <span key={shown.text} className={reducedMotion ? wordClass : `${wordClass} animate-word-in`}>
        {shown.text}
        {countdown !== null && (
          <span className="ml-3 align-baseline text-[0.42em] tabular-nums text-countdown">
            {countdown}
          </span>
        )}
      </span>
    </div>
  );
}
