import { useSettings } from '../store/useSettings';
import { focusRing } from './ui';

/**
 * First-visit micro-onboarding (PRD §7): one dismissible line, never
 * shown again. Also auto-dismissed by Home when the first session starts.
 */
export function OnboardingHint() {
  const dismissed = useSettings((s) => s.onboardingDismissed);
  const dismiss = useSettings((s) => s.dismissOnboarding);

  if (dismissed) return null;

  return (
    <p role="note" className="flex items-center gap-1 text-meta text-ink-muted">
      Follow the orb. In as it grows, out as it settles.
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className={`grid h-11 w-11 place-items-center rounded-full text-ink-faint transition-colors hover:text-ink-max ${focusRing}`}
      >
        {/* Inline SVG with a 44px hit floor: the old text ✕ was a 20x26 target,
            failing WCAG 2.5.8 outright, and rendered inconsistently. */}
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3 fill-current">
          <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.41 6.29 6.3-6.29 6.3 1.4 1.41 6.3-6.3 6.3 6.3 1.4-1.41-6.29-6.3 6.29-6.3z" />
        </svg>
      </button>
    </p>
  );
}
