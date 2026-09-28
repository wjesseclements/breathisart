import { pillButton, primaryButton } from '../ui';

interface SessionSummaryProps {
  patternName: string;
  time: string;
  cycles: number;
  onAgain: () => void;
  onDone: () => void;
}

/**
 * The close, not a receipt (PLAN_V2 slice 18).
 *
 * It used to read "6 min · 32 cycles" — two numbers of equal weight, one of
 * which scores the single thing in this product that should not be scored.
 * The pattern and the time are the headline now; the cycle count is demoted to
 * a whisper beneath it, kept only because it is a genuine record of what you
 * did rather than a target to beat.
 */
export function SessionSummary({
  patternName,
  time,
  cycles,
  onAgain,
  onDone,
}: SessionSummaryProps) {
  return (
    <div role="status" className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <p className="font-display text-title font-light text-ink-strong">
          {patternName} · {time}
        </p>
        <p className="text-label uppercase text-ink-faint">
          {cycles} {cycles === 1 ? 'cycle' : 'cycles'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onAgain} className={primaryButton}>
          Again
        </button>
        <button type="button" onClick={onDone} className={pillButton}>
          Done
        </button>
      </div>
    </div>
  );
}
