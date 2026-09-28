import { useEffect, useMemo, useRef } from 'react';
import type { BreathPattern, Phase } from '../../engine/patterns';
import { validatePhases } from '../../engine/patterns';
import { breathLevel, phaseLevelRanges, phaseWord } from '../Pacer/pacerMath';
import { useBreathSession } from '../Pacer/useBreathSession';
import { usePrefersReducedMotion } from '../Pacer/usePrefersReducedMotion';

/** Live mini orb running the draft pattern; restarts on every edit. */
export function MiniPreview({ phases }: { phases: Phase[] }) {
  const valid = validatePhases(phases).length === 0;
  const pattern = useMemo<BreathPattern | null>(
    () =>
      valid ? { id: '__preview__', name: 'Preview', tagline: '', phases, builtIn: false } : null,
    [valid, phases],
  );

  if (!pattern) {
    return (
      <div className="flex h-16 items-center text-xs text-ink-faint">
        Preview appears when the pattern is valid.
      </div>
    );
  }
  return <RunningPreview pattern={pattern} />;
}

function RunningPreview({ pattern }: { pattern: BreathPattern }) {
  const session = useBreathSession(pattern);
  const reducedMotion = usePrefersReducedMotion();
  const orbRef = useRef<HTMLDivElement>(null);

  const { start, onFrame } = session;
  useEffect(() => {
    start(); // auto-run; a new engine (edited draft) restarts the preview
  }, [start]);

  const { phases } = pattern;
  const levelRanges = useMemo(() => phaseLevelRanges(phases), [phases]);
  useEffect(
    () =>
      onFrame((snap) => {
        const level = breathLevel(levelRanges, snap.phaseIndex, snap.t);
        const orb = orbRef.current;
        if (!orb) return;
        if (reducedMotion) {
          orb.style.transform = 'scale(0.8)';
          orb.style.opacity = String(0.4 + 0.6 * level);
        } else {
          orb.style.transform = `scale(${0.45 + 0.55 * level})`;
          orb.style.opacity = '1';
        }
      }),
    [onFrame, levelRanges, reducedMotion],
  );

  return (
    <div className="flex h-16 items-center gap-4">
      <div className="relative h-14 w-14 shrink-0">
        <div
          ref={orbRef}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-breath-teal to-breath-indigo will-change-transform"
        />
      </div>
      <span className="text-xs text-ink-muted">{phaseWord(session.phase)}</span>
    </div>
  );
}
