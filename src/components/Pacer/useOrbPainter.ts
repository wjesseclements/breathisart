import { useCallback, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import type { Phase } from '../../engine/patterns';
import { breathLevel, followLevel, phaseLevelRanges } from './pacerMath';
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

/** The ring fades across its dashoffset reset so the jump is never seen. */
export const RING_FADE_LEAD_S = 0.25;
/** Degrees per second. Incommensurate (ratio 1.774) so they never re-align. */
const CAUSTIC_A_RATE = 0.55;
const CAUSTIC_B_RATE = -0.31;

type Div = RefObject<HTMLDivElement>;

export interface PainterTargets {
  orb: Div;
  innerLight: Div;
  bounce: Div;
  depth: Div;
  causticA: Div;
  causticB: Div;
  waterline: Div;
  rim: Div;
  fieldNear: Div;
  fieldFar: Div;
  ground: Div;
  ring: RefObject<SVGCircleElement>;
  /**
   * The room's cast-light layer, owned by `Home` and painted by `Background`.
   * Optional so the pacer still works without a room around it (the builder's
   * mini preview). Driven from the FAR follower, so the room trails the breath
   * by ~440ms -- the medium lags the body.
   */
  roomLight?: Div;
}

/**
 * Paints one frame of the pacer (PLAN_V2 slice 15).
 *
 * Separated from the component so `Pacer` stays about lifecycle and this stays
 * about pixels. It writes `transform`, `opacity` and `strokeDashoffset` and
 * nothing else, ever — the whole layer stack depends on that being true.
 *
 * Returns a stable `drawFrame(phaseIndex, t, elapsed, cycles)` plus the ref
 * holding the last frame, so callers can repaint after a pause.
 */
export function useOrbPainter(
  phases: readonly Phase[],
  reducedMotion: boolean,
  targets: PainterTargets,
) {
  const lastFrameRef = useRef({ phaseIndex: 0, t: 0 });
  const bodyRef = useRef<BodyState>({ value: 0, velocity: 0 });
  const slowRef = useRef<{ lum: number; near: number; far: number; depth: number } | null>(null);
  const atMsRef = useRef<number | null>(null);
  const levelRanges = useMemo(() => phaseLevelRanges(phases), [phases]);

  const {
    orb: orbRef,
    innerLight: innerLightRef,
    bounce: bounceRef,
    depth: depthRef,
    causticA: causticARef,
    causticB: causticBRef,
    waterline: waterlineRef,
    rim: rimRef,
    fieldNear: fieldNearRef,
    fieldFar: fieldFarRef,
    ground: groundRef,
    ring: ringRef,
    roomLight: roomLightRef,
  } = targets;

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

      // The room answers the lamp. Driven from the FAR follower, so it trails
      // the breath by ~440ms: the medium lags the body.
      if (roomLightRef?.current && !reducedMotion) {
        roomLightRef.current.style.opacity = String(0.18 + 0.52 * slow.far);
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
    [
      phases,
      levelRanges,
      reducedMotion,
      orbRef,
      innerLightRef,
      bounceRef,
      depthRef,
      causticARef,
      causticBRef,
      waterlineRef,
      rimRef,
      fieldNearRef,
      fieldFarRef,
      ringRef,
      groundRef,
      roomLightRef,
    ],
  );

  /** Drop the frame clock so a resume glides from the current scene, not the
   *  pre-pause one. */
  const resetClock = useCallback(() => {
    atMsRef.current = null;
  }, []);

  return { drawFrame, lastFrameRef, resetClock };
}
