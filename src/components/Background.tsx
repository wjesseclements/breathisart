const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

import { usePrefersReducedMotion } from './Pacer/usePrefersReducedMotion';

/**
 * Barely-perceptible animated gradient + static grain so the scene feels
 * alive (PRD §4). The gradient pulses opacity only; reduced motion (OS
 * setting or in-app override) gets the static version.
 */
export function Background() {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-slate-100 dark:bg-night" />
      <div
        className={`absolute -inset-1/4 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.5),transparent_60%)] opacity-[0.06] ${
          reducedMotion ? '' : 'animate-pulse-slow motion-reduce:animate-none'
        }`}
      />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}
