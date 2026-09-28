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
    <p role="note" className="flex items-center gap-3 text-sm text-ink-muted">
      Follow the orb. In as it grows, out as it settles.
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className={`rounded-full px-2 py-0.5 text-xs text-ink-faint transition-colors hover:text-ink-max ${focusRing}`}
      >
        ✕
      </button>
    </p>
  );
}
