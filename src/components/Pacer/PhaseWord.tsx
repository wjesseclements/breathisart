import { useState } from 'react';

/**
 * Cross-fades between phase words: the outgoing word fades out while the
 * incoming one fades in. Opacity-only, so it stays gentle under reduced
 * motion. Purely decorative — the aria-live announcement lives in Pacer.
 */
export function PhaseWord({ text }: { text: string }) {
  const [shown, setShown] = useState<{ text: string; prev: string | null }>({ text, prev: null });
  // Render-phase state adjustment (React's documented pattern for
  // tracking the previous value of a prop).
  if (shown.text !== text) {
    setShown({ text, prev: shown.text });
  }

  const wordClass =
    'absolute inset-x-0 font-display text-3xl font-light text-slate-700 dark:text-whisper';
  return (
    <div className="relative h-12 w-full text-center" aria-hidden="true">
      {shown.prev !== null && (
        <span key={`${shown.prev}->${shown.text}`} className={`${wordClass} animate-word-out`}>
          {shown.prev}
        </span>
      )}
      <span key={shown.text} className={`${wordClass} animate-word-in`}>
        {shown.text}
      </span>
    </div>
  );
}
