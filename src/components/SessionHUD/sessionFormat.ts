/** "1:05" style clock for the in-session HUD. */
export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** "3:42 left" for a timed session. Remaining, not elapsed. */
export function formatRemaining(secondsLeft: number): string {
  return `${formatClock(Math.max(0, secondsLeft))} left`;
}

/**
 * The end-of-session headline (PRD §5).
 *
 * Floors rather than rounds: `Math.round` turned a 90-second session into
 * "2 min", which is a small lie at exactly the moment the app should be most
 * trustworthy. Cycles are returned separately so the caller can demote them —
 * "32 cycles" quantifies the one thing in this product that should not be
 * scored.
 */
export function formatSummary(elapsedSeconds: number): string {
  const total = Math.floor(elapsedSeconds);
  if (total < 60) return `${total} sec`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds}`;
}
