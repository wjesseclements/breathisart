/** "1:05" style clock for the in-session HUD. */
export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Gentle end-of-session summary, e.g. "6 min · 32 cycles" (PRD §5). */
export function formatSummary(elapsedSeconds: number, cycles: number): string {
  const time =
    elapsedSeconds < 60
      ? `${Math.floor(elapsedSeconds)} sec`
      : `${Math.round(elapsedSeconds / 60)} min`;
  return `${time} · ${cycles} ${cycles === 1 ? 'cycle' : 'cycles'}`;
}
