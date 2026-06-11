import { useCallback, useEffect, useRef } from 'react';
import type { BreathPattern } from '../../engine/patterns';
import { useSettings } from '../../store/useSettings';
import { breathLevel, phaseWord } from './pacerMath';
import { PATTERN_ACCENTS, DEFAULT_ACCENT } from './pacerTheme';
import { PhaseWord } from './PhaseWord';
import { ProgressRing } from './ProgressRing';
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
  const showCountdown = useSettings((s) => s.showCountdown);
  const accent = PATTERN_ACCENTS[pattern.id] ?? DEFAULT_ACCENT;

  const orbRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);
  const haloInnerRef = useRef<HTMLDivElement>(null);
  const haloOuterRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const countdownRef = useRef<HTMLSpanElement>(null);
  const lastFrameRef = useRef({ phaseIndex: 0, t: 0 });

  // All per-frame updates touch only transform/opacity (plus the ring's
  // normalized strokeDashoffset), via refs — no React re-render at 60fps.
  const { phases } = pattern;
  const drawFrame = useCallback(
    (phaseIndex: number, t: number) => {
      lastFrameRef.current = { phaseIndex, t };
      const level = breathLevel(phases, phaseIndex, t);

      const orb = orbRef.current;
      if (orb) {
        if (reducedMotion) {
          orb.style.transform = `scale(${(MIN_SCALE + MAX_SCALE) / 2})`;
          orb.style.opacity = String(0.55 + 0.45 * level);
        } else {
          orb.style.transform = `scale(${MIN_SCALE + (MAX_SCALE - MIN_SCALE) * level})`;
          orb.style.opacity = '1';
        }
      }
      if (accentRef.current) accentRef.current.style.opacity = String(level);

      // Halos expand at slightly different rates (parallax breathing).
      const inner = haloInnerRef.current;
      const outer = haloOuterRef.current;
      if (inner && outer) {
        if (reducedMotion) {
          inner.style.transform = 'scale(0.85)';
          outer.style.transform = 'scale(0.9)';
        } else {
          inner.style.transform = `scale(${0.6 + 0.46 * Math.pow(level, 1.15)})`;
          outer.style.transform = `scale(${0.58 + 0.6 * Math.pow(level, 0.85)})`;
        }
        inner.style.opacity = String(0.18 + 0.2 * level);
        outer.style.opacity = String(0.1 + 0.14 * level);
      }

      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(100 * (1 - t));

      const countdown = countdownRef.current;
      if (countdown) {
        const remaining = String(Math.max(1, Math.ceil(phases[phaseIndex].seconds * (1 - t))));
        if (countdown.textContent !== remaining) countdown.textContent = remaining;
      }
    },
    [phases, reducedMotion],
  );

  const { onFrame, status } = session;
  useEffect(() => {
    if (status === 'idle') drawFrame(0, 0);
    else drawFrame(lastFrameRef.current.phaseIndex, lastFrameRef.current.t);
    return onFrame((snap) => drawFrame(snap.phaseIndex, snap.t));
  }, [onFrame, status, drawFrame]);

  // Space = start/pause. Skip when an interactive element has focus —
  // a focused button already handles space natively.
  const { toggle } = session;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea, [role="button"], [role="dialog"]'))
        return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const idle = status === 'idle';
  const orbLabel = idle
    ? 'Begin breathing session'
    : `${status === 'running' ? 'Pause' : 'Resume'} breathing session`;
  const announcement =
    status === 'running' ? phaseWord(session.phase) : status === 'paused' ? 'Paused' : '';

  return (
    <div className="flex flex-col items-center gap-10">
      <button
        type="button"
        onClick={session.toggle}
        aria-label={orbLabel}
        className="relative h-56 w-56 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal sm:h-64 sm:w-64"
      >
        {/* Idle ambient float wraps everything; CSS-animated, idle only. */}
        <div
          className={`absolute inset-0 ${idle && !reducedMotion ? 'animate-ambient motion-reduce:animate-none' : ''}`}
        >
          <div
            ref={haloOuterRef}
            aria-hidden="true"
            className={`absolute -inset-10 rounded-full blur-3xl will-change-transform ${accent.halo}`}
          />
          <div
            ref={haloInnerRef}
            aria-hidden="true"
            className={`absolute -inset-4 rounded-full blur-2xl will-change-transform ${accent.halo}`}
          />
          <div
            ref={orbRef}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-breath-indigo to-night-mist will-change-transform"
          >
            <div
              ref={accentRef}
              className={`absolute inset-0 rounded-full opacity-0 ${accent.accentLayer}`}
            />
          </div>
          {!idle && showCountdown && (
            <span
              ref={countdownRef}
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center font-display text-2xl font-light tabular-nums text-slate-500/50 dark:text-white/30"
            />
          )}
        </div>
        <ProgressRing circleRef={ringRef} visible={!idle} colorClass={accent.ring} />
      </button>

      <PhaseWord text={idle ? pattern.name : phaseWord(session.phase)} />

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
