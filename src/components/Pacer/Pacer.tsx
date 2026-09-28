import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BreathPattern } from '../../engine/patterns';
import { focusRingOffset8 } from '../ui';
import { breathLevel, followLevel, phaseLevelRanges, phaseWord } from './pacerMath';
import {
  DEPTH_TAU_S,
  FAR_TAU_S,
  LUM_TAU_S,
  MAX_SCALE,
  MIN_SCALE,
  NEAR_TAU_S,
  REDUCED_MIN_SCALE,
  REDUCED_TAU_S,
  areaScale,
  stepBody,
  wobble,
} from './pacerFollowers';
import type { BodyState } from './pacerFollowers';
import { OrbLayers } from './OrbLayers';
import { DEFAULT_ACCENT, PATTERN_ACCENTS, accentVars } from './pacerTheme';
import { PhaseWord } from './PhaseWord';
import { ProgressRing } from './ProgressRing';
import type { BreathSession } from './useBreathSession';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** People need ~300ms to act on a cue, so the word leads the boundary. */
const WORD_LEAD_S = 0.35;
/** The ring fades across its dashoffset reset so the jump is never seen. */
const RING_FADE_LEAD_S = 0.25;
/** Degrees per second. Incommensurate (ratio 1.774) so they never re-align. */
const CAUSTIC_A_RATE = 0.55;
const CAUSTIC_B_RATE = -0.31;

interface PacerProps {
  pattern: BreathPattern;
  session: BreathSession;
}

export function Pacer({ pattern, session }: PacerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const accent = PATTERN_ACCENTS[pattern.id] ?? DEFAULT_ACCENT;

  const orbRef = useRef<HTMLDivElement>(null);
  const innerLightRef = useRef<HTMLDivElement>(null);
  const bounceRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const causticARef = useRef<HTMLDivElement>(null);
  const causticBRef = useRef<HTMLDivElement>(null);
  const waterlineRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<HTMLDivElement>(null);
  const fieldNearRef = useRef<HTMLDivElement>(null);
  const fieldFarRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const lastFrameRef = useRef({ phaseIndex: 0, t: 0 });
  /** Four followers, not one: the whole point is that they peak at different times. */
  const bodyRef = useRef<BodyState>({ value: 0, velocity: 0 });
  const slowRef = useRef<{ lum: number; near: number; far: number; depth: number } | null>(null);
  const atMsRef = useRef<number | null>(null);

  const { phases } = pattern;
  const levelRanges = useMemo(() => phaseLevelRanges(phases), [phases]);

  const drawFrame = useCallback(
    (phaseIndex: number, t: number, elapsed: number, cycles: number) => {
      lastFrameRef.current = { phaseIndex, t };
      const target = breathLevel(levelRanges, phaseIndex, t);

      const nowMs = performance.now();
      const dt = atMsRef.current === null ? 0 : (nowMs - atMsRef.current) / 1000;
      atMsRef.current = nowMs;

      // The body: second-order under reduced motion's threshold, first-order
      // above it — reduced motion must never overshoot.
      let level: number;
      if (reducedMotion) {
        const prev = bodyRef.current.value;
        level = dt ? target + (prev - target) * Math.exp(-dt / REDUCED_TAU_S) : target;
        bodyRef.current = { value: level, velocity: 0 };
      } else {
        bodyRef.current = dt
          ? stepBody(bodyRef.current, target, dt)
          : { value: target, velocity: 0 };
        level = bodyRef.current.value;
      }

      const prevSlow = slowRef.current ?? {
        lum: target,
        near: target,
        far: target,
        depth: 1 - target,
      };
      const slow = dt
        ? {
            lum: followLevel(prevSlow.lum, target, dt, LUM_TAU_S),
            near: followLevel(prevSlow.near, target, dt, NEAR_TAU_S),
            far: followLevel(prevSlow.far, target, dt, FAR_TAU_S),
            depth: followLevel(prevSlow.depth, 1 - target, dt, DEPTH_TAU_S),
          }
        : prevSlow;
      slowRef.current = slow;

      const amp = reducedMotion ? 1 : wobble(cycles);
      const min = reducedMotion ? REDUCED_MIN_SCALE : MIN_SCALE;

      const orb = orbRef.current;
      if (orb) {
        const scale = reducedMotion ? min + (MAX_SCALE - min) * level : areaScale(level) * amp;
        // A 3px lift on the inhale: it rises as it fills.
        const lift = reducedMotion ? 0 : (1 - level) * 3;
        orb.style.transform = `translate3d(0, ${lift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      }

      if (innerLightRef.current) {
        innerLightRef.current.style.opacity = String(
          reducedMotion ? 0.07 + 0.32 * level : 0.09 + 0.36 * slow.lum,
        );
      }
      if (bounceRef.current) {
        bounceRef.current.style.opacity = String(reducedMotion ? 0.4 : 0.35 + 0.25 * level);
      }
      if (depthRef.current) {
        depthRef.current.style.opacity = String(
          reducedMotion ? 0.5 * (1 - level) : 0.46 * slow.depth,
        );
      }
      if (rimRef.current) {
        rimRef.current.style.opacity = String(
          reducedMotion ? 0.22 + 0.3 * level : 0.26 + 0.4 * slow.lum,
        );
      }

      // Fields modulate light under reduced motion, size otherwise.
      const near = fieldNearRef.current;
      const far = fieldFarRef.current;
      if (near && far) {
        if (reducedMotion) {
          near.style.transform = 'scale(0.92)';
          far.style.transform = 'scale(0.86)';
          near.style.opacity = String(0.12 + 0.3 * level);
          far.style.opacity = String(0.08 + 0.16 * level);
        } else {
          near.style.transform = `scale(${(0.8 + 0.3 * slow.near).toFixed(4)})`;
          far.style.transform = `scale(${(0.7 + 0.44 * slow.far).toFixed(4)})`;
          near.style.opacity = String(0.5 + 0.36 * slow.near);
          far.style.opacity = String(0.42 + 0.34 * slow.far);
        }
      }

      if (groundRef.current) {
        groundRef.current.style.transform = `scale(${(0.82 + 0.26 * level).toFixed(4)}, 1)`;
        groundRef.current.style.opacity = String(0.24 + 0.3 * level);
      }

      // Holds are not a frozen frame: the caustics always turn, and a
      // sub-threshold shimmer rides on top. Neither touches breath level.
      if (!reducedMotion) {
        const holdShimmer =
          phases[phaseIndex].kind === 'hold'
            ? 0.05 *
              Math.sin(2 * Math.PI * 0.55 * (phases[phaseIndex].seconds * t)) *
              Math.min(1, (phases[phaseIndex].seconds * t) / 0.4)
            : 0;
        if (causticARef.current) {
          causticARef.current.style.transform = `rotate(${(CAUSTIC_A_RATE * elapsed).toFixed(3)}deg)`;
          causticARef.current.style.opacity = String(0.85 + holdShimmer);
        }
        if (causticBRef.current) {
          causticBRef.current.style.transform = `rotate(${(CAUSTIC_B_RATE * elapsed).toFixed(3)}deg)`;
          causticBRef.current.style.opacity = String(0.85 + holdShimmer);
        }
      }

      if (waterlineRef.current) {
        waterlineRef.current.style.transform = `translate3d(0, ${((1 - level) * 100).toFixed(2)}%, 0)`;
      }

      const ring = ringRef.current;
      if (ring) {
        const exhaling = phases[phaseIndex].kind === 'exhale';
        ring.style.strokeDashoffset = String(exhaling ? 100 * t : 100 * (1 - t));
        const secondsIn = phases[phaseIndex].seconds * t;
        const secondsLeft = phases[phaseIndex].seconds * (1 - t);
        const fade = Math.min(1, secondsIn / RING_FADE_LEAD_S, secondsLeft / RING_FADE_LEAD_S);
        ring.style.opacity = String(0.6 * fade);
      }
    },
    [phases, levelRanges, reducedMotion],
  );

  const [wordIndex, setWordIndex] = useState(session.phaseIndex);
  const { onFrame, status } = session;
  if (status !== 'running' && wordIndex !== session.phaseIndex) {
    setWordIndex(session.phaseIndex);
  }

  useEffect(() => {
    if (status === 'idle') drawFrame(0, 0, 0, 0);
    else drawFrame(lastFrameRef.current.phaseIndex, lastFrameRef.current.t, 0, 0);
    return onFrame((snap) => {
      drawFrame(snap.phaseIndex, snap.t, snap.elapsed, snap.cycles);
      const secondsLeft = phases[snap.phaseIndex].seconds * (1 - snap.t);
      setWordIndex(
        secondsLeft <= WORD_LEAD_S ? (snap.phaseIndex + 1) % phases.length : snap.phaseIndex,
      );
    });
  }, [onFrame, status, drawFrame, phases]);

  // Resuming should glide from where the scene actually is, not snap.
  useEffect(() => {
    if (status !== 'running') atMsRef.current = null;
  }, [status]);

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
        data-status={status}
        style={accentVars(accent)}
        className={`pacer relative h-[min(17rem,44svh)] w-[min(17rem,44svh)] rounded-full ${focusRingOffset8}`}
      >
        <div
          className={`absolute inset-0 ${idle && !reducedMotion ? 'animate-ambient motion-reduce:animate-none' : ''}`}
        >
          <OrbLayers
            reducedMotion={reducedMotion}
            orb={orbRef}
            innerLight={innerLightRef}
            bounce={bounceRef}
            depth={depthRef}
            causticA={causticARef}
            causticB={causticBRef}
            waterline={waterlineRef}
            rim={rimRef}
            fieldNear={fieldNearRef}
            fieldFar={fieldFarRef}
            ground={groundRef}
          />
        </div>
        <ProgressRing circleRef={ringRef} visible={!idle} />
      </button>

      <PhaseWord text={idle ? pattern.name : phaseWord(phases[wordIndex] ?? session.phase)} />

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
