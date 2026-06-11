import { useCallback, useEffect, useRef } from 'react';
import type { BreathPattern } from '../../engine/patterns';
import { breathLevel, phaseWord } from './pacerMath';
import { PhaseWord } from './PhaseWord';
import type { BreathSession } from './useBreathSession';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const MIN_SCALE = 0.62;
const MAX_SCALE = 1;

interface PacerProps {
  pattern: BreathPattern;
  session: BreathSession;
}

export function Pacer({ pattern, session }: PacerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const orbRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef(0);

  // Per-frame updates touch only transform and opacity, via refs — no
  // React re-render at 60fps. Reduced motion swaps the scale for an
  // opacity/color crossfade and keeps the size fixed.
  const applyLevel = useCallback(
    (level: number) => {
      levelRef.current = level;
      const orb = orbRef.current;
      const accent = accentRef.current;
      if (!orb || !accent) return;
      if (reducedMotion) {
        orb.style.transform = `scale(${(MIN_SCALE + MAX_SCALE) / 2})`;
        orb.style.opacity = String(0.55 + 0.45 * level);
      } else {
        orb.style.transform = `scale(${MIN_SCALE + (MAX_SCALE - MIN_SCALE) * level})`;
        orb.style.opacity = '1';
      }
      accent.style.opacity = String(level);
    },
    [reducedMotion],
  );

  const { onFrame, status } = session;
  const { phases } = pattern;
  useEffect(() => {
    // Re-apply on mount, pattern change, status change, or reduced-motion
    // toggle: idle resets to the pattern's starting level, otherwise keep
    // the level of the last rendered frame (e.g. frozen while paused).
    applyLevel(status === 'idle' ? breathLevel(phases, 0, 0) : levelRef.current);
    return onFrame((snap) => applyLevel(breathLevel(phases, snap.phaseIndex, snap.t)));
  }, [onFrame, status, phases, applyLevel]);

  // Space = start/pause. Skip when an interactive element has focus —
  // a focused button already handles space natively.
  const { toggle } = session;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea, [role="button"]')) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const controlLabel =
    session.status === 'idle' ? 'Begin' : session.status === 'running' ? 'Pause' : 'Resume';
  const orbLabel =
    session.status === 'idle' ? 'Begin breathing session' : `${controlLabel} breathing session`;
  const announcement =
    session.status === 'running'
      ? phaseWord(session.phase)
      : session.status === 'paused'
        ? 'Paused'
        : '';

  return (
    <div className="flex flex-col items-center gap-10">
      <button
        type="button"
        onClick={session.toggle}
        aria-label={orbLabel}
        className="relative h-56 w-56 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-breath-teal sm:h-64 sm:w-64"
      >
        <div
          ref={orbRef}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-breath-indigo to-night-mist will-change-transform"
        >
          <div
            ref={accentRef}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-breath-teal to-breath-indigo opacity-0"
          />
        </div>
      </button>

      <PhaseWord text={session.status === 'idle' ? pattern.name : phaseWord(session.phase)} />

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
