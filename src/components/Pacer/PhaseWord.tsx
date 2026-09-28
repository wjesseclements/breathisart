import { useState } from 'react';

interface PhaseWordProps {
  text: string;
  /** Type size for the whole session, chosen once from the pattern's longest word. */
  sizeClass: string;
  /** Seconds left in this phase, or null to hide the numeral. */
  countdown: number | null;
  /** Hard-swaps instead of crossfading, and stops any double-image. */
  reducedMotion: boolean;
}

/**
 * The phase word, with the countdown on its own line beneath it.
 *
 * The numeral used to sit inline beside the word at 0.42em. Two type sizes
 * that far apart on one baseline read as a word with a footnote stuck to it
 * rather than as one considered thing — the size clash was the problem, not
 * the number. Giving it its own line lets the word be the word and the count
 * be quiet meta beneath it, and it keeps the composition centred.
 */
export function PhaseWord({ text, sizeClass, countdown, reducedMotion }: PhaseWordProps) {
  const [shown, setShown] = useState<{ text: string; prev: string | null }>({ text, prev: null });
  // Render-phase state adjustment (React's documented pattern for tracking the
  // previous value of a prop).
  if (shown.text !== text) {
    setShown({ text, prev: reducedMotion ? null : shown.text });
  }

  // `whitespace-nowrap`: a wrapped phase word overflows its line box and
  // collides with whatever sits beneath it.
  const wordClass =
    'absolute inset-x-0 whitespace-nowrap font-display font-light leading-none text-ink-display';

  return (
    <div aria-hidden="true" className="flex w-full flex-col items-center gap-4">
      <div className={`relative h-[1.15em] w-full text-center ${sizeClass} leading-none`}>
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
        </span>
      </div>
      {countdown !== null && <p className="text-meta tabular-nums text-countdown">{countdown}</p>}
    </div>
  );
}
