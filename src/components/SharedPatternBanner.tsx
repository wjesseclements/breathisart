import type { BreathPattern } from '../engine/patterns';

const smallButton =
  'shrink-0 rounded-full border border-slate-300 dark:border-night-mist px-4 py-1 text-xs text-slate-600 dark:text-slate-400 transition-colors hover:border-breath-teal hover:text-slate-900 dark:hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-breath-teal';

interface SharedPatternBannerProps {
  /** Decoded shared pattern, or null when the link was invalid. */
  pattern: BreathPattern | null;
  onSave: () => void;
  onDismiss: () => void;
}

/** Shown when the page loads with a `?p=` pattern in the URL (PRD §7). */
export function SharedPatternBanner({ pattern, onSave, onDismiss }: SharedPatternBannerProps) {
  return (
    <div
      role="status"
      className="flex max-w-md flex-wrap items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm text-slate-700 dark:bg-night-soft dark:text-slate-300"
    >
      {pattern ? (
        <>
          <div className="min-w-0">
            <p className="truncate">
              Shared pattern: <span className="font-medium">{pattern.name}</span>
            </p>
            <p className="truncate text-xs text-slate-500">{pattern.tagline}</p>
          </div>
          <button type="button" onClick={onSave} className={smallButton}>
            Save this pattern
          </button>
          <button type="button" onClick={onDismiss} className={smallButton}>
            Dismiss
          </button>
        </>
      ) : (
        <>
          <p>That shared pattern link isn’t valid.</p>
          <button type="button" onClick={onDismiss} className={smallButton}>
            Dismiss
          </button>
        </>
      )}
    </div>
  );
}
