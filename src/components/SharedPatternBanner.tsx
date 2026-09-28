import type { BreathPattern } from '../engine/patterns';
import { focusRing } from './ui';

const smallButton = `shrink-0 rounded-full border border-line px-4 py-1 text-xs text-ink-muted transition-colors hover:border-accent hover:text-ink-max ${focusRing}`;

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
      className="flex max-w-md flex-wrap items-center gap-3 rounded-xl bg-surface-raised px-5 py-3 text-sm text-ink"
    >
      {pattern ? (
        <>
          <div className="min-w-0">
            <p className="truncate">
              Shared pattern: <span className="font-medium">{pattern.name}</span>
            </p>
            <p className="truncate text-xs text-ink-faint">{pattern.tagline}</p>
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
