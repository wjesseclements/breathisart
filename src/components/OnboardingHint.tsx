import { useSettings } from '../store/useSettings';

/**
 * First-visit micro-onboarding (PRD §7): one dismissible line, never
 * shown again. Also auto-dismissed by Home when the first session starts.
 */
export function OnboardingHint() {
  const dismissed = useSettings((s) => s.onboardingDismissed);
  const dismiss = useSettings((s) => s.dismissOnboarding);

  if (dismissed) return null;

  return (
    <p role="note" className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
      Follow the orb. In as it grows, out as it settles.
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="rounded-full px-2 py-0.5 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal"
      >
        ✕
      </button>
    </p>
  );
}
