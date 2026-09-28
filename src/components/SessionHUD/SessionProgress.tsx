import { useEffect, useRef } from 'react';
import type { BreathSession } from '../Pacer/useBreathSession';

/**
 * A 1px hairline across the foot of the viewport, filling once over a timed
 * session (PLAN_V2 slice 18).
 *
 * Timed sessions previously gave zero feedback: you set five minutes and got
 * nothing at all until the chime. This is the quietest possible answer —
 * ambient, ignorable, and driven from the same frame snapshot as everything
 * else, writing only `transform`.
 */
export function SessionProgress({
  session,
  limitSeconds,
  reducedMotion,
}: {
  session: BreathSession;
  limitSeconds: number | null;
  reducedMotion: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const { onFrame } = session;

  useEffect(() => {
    if (limitSeconds === null || reducedMotion) return;
    return onFrame((snap) => {
      const bar = barRef.current;
      if (!bar) return;
      const p = Math.min(1, snap.elapsed / limitSeconds);
      bar.style.transform = `scaleX(${p.toFixed(5)})`;
    });
  }, [onFrame, limitSeconds, reducedMotion]);

  if (limitSeconds === null || reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-px overflow-hidden"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-[rgb(var(--accent-core)/0.15)]"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
