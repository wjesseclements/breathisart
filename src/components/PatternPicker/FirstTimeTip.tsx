import { useSettings } from '../../store/useSettings';

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
      className="flex max-w-md items-center gap-4 rounded-xl bg-white dark:bg-night-soft px-5 py-3 text-sm text-slate-700 dark:text-slate-300"
    >
      <p>Mild lightheadedness is common with 4-7-8 at first — start with 2–4 cycles.</p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-full border border-slate-300 dark:border-night-mist px-3 py-1 text-xs text-slate-600 dark:text-slate-400 transition-colors hover:border-teal-600 dark:hover:border-breath-teal hover:text-slate-900 dark:hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal"
      >
        Got it
      </button>
    </div>
  );
}
