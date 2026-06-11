import { pillButton } from '../ui';

interface SessionSummaryProps {
  text: string;
  onAgain: () => void;
  onDone: () => void;
}

/** Gentle post-session summary ("6 min · 32 cycles") with Again / Done. */
export function SessionSummary({ text, onAgain, onDone }: SessionSummaryProps) {
  return (
    <div role="status" className="flex items-center gap-5">
      <span className="text-sm text-slate-300">{text}</span>
      <button type="button" onClick={onAgain} className={pillButton}>
        Again
      </button>
      <button type="button" onClick={onDone} className={pillButton}>
        Done
      </button>
    </div>
  );
}
