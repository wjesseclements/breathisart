import { useSettings } from '../../store/useSettings';
import { focusRingOffset2 } from '../ui';

/**
 * One-time caution for 4-7-8 (PRD §3): mild lightheadedness is common,
 * start small. Dismissal persists via the settings store.
 */
export function FirstTimeTip() {
  const selectedId = useSettings((s) => s.selectedPatternId);
  const dismissed = useSettings((s) => s.tip478Dismissed);
  const dismiss = useSettings((s) => s.dismissTip478);

  if (selectedId !== '478' || dismissed) return null;

  return (
    <div
      role="note"
      className="flex max-w-md items-center gap-4 rounded-xl bg-surface-raised px-5 py-3 text-sm text-ink"
    >
      <p>Mild lightheadedness is common with 4-7-8 at first — start with 2–4 cycles.</p>
      <button
        type="button"
        onClick={dismiss}
        className={`shrink-0 rounded-full border border-line px-3 py-1 text-xs text-ink-muted transition-colors hover:border-accent hover:text-ink-max ${focusRingOffset2}`}
      >
        Got it
      </button>
    </div>
  );
}
