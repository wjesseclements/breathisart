/**
 * The pacer's motion model (PLAN_V2 slice 15).
 *
 * The engine emits one `level` per frame. Rendering it directly through a
 * single follower is what made the old orb read as a pulsing badge: scale,
 * glow and both halos all peaked on the identical frame. Amplitude gains
 * (`Math.pow`) do not fix that — they change how far, not when.
 *
 * So the breath is split across four followers with different time constants,
 * all fed from the same clock: the body fills, then it glows, then the near
 * air follows, then the room. Pure TS, no React — unit-tested.
 */

/** Fully contracted. Below the old 0.62 on purpose: lungs move ~1.28x in radius. */
export const MIN_SCALE = 0.84;
/**
 * Fully expanded. Never 1.0: the second-order follower overshoots past its
 * target, and a composited layer scaled above 1 resamples a texture that was
 * rasterized smaller — which visibly softens the 1px rim hairline and the 9px
 * annulus, the exact details this design spends its budget on.
 */
export const MAX_SCALE = 0.965;
/**
 * Divergence guard on follower output — NOT the artistic overshoot.
 *
 * The direction originally specified a 1.005 ceiling here, but that silently
 * contradicts itself: clamping level at 1.005 makes the 4% overshoot that
 * justifies a second-order follower impossible. The unit test caught it.
 *
 * The clamp isn't needed for the raster rule anyway. Because scale is mapped
 * by AREA, a 4.2% overshoot in level compresses to ~0.5% in scale, and
 * MAX_SCALE 0.965 already leaves 3.5% of headroom. Even at this guard value
 * and maximum wobble the drawn scale stays below 1.0 — asserted in the tests.
 */
export const LEVEL_GUARD = 1.08;

/**
 * Maps breath level to scale by AREA, not radius. The eye integrates area, so
 * a linear-in-radius ramp arrives with a distorted velocity profile and feels
 * hollow at the top of the inhale.
 */
export function areaScale(level: number): number {
  const lo = MIN_SCALE * MIN_SCALE;
  const hi = MAX_SCALE * MAX_SCALE;
  return Math.sqrt(lo + (hi - lo) * level);
}

/**
 * Damping ratio. Was 0.72, which overshot 3.3% at each turn — a small bounce
 * that reads as liveliness in a UI and as *twitch* in a breath pacer. Jesse
 * asked for every transition to be gentler, so this is now near-critical:
 * the turn arrives and settles without ever crossing its target.
 */
export const BODY_ZETA = 0.9;
/**
 * Natural frequency (rad/s). Measured at ζ=0.90: peak overshoot 0.07% —
 * imperceptible — and permanently inside 1% of target by 483ms. Slower than
 * the previous 14 on purpose: the approach itself is part of what makes a
 * transition feel soft.
 */
export const BODY_OMEGA_N = 11;
/** Fixed sub-step for the integrator, so behavior is frame-rate independent. */
const SUB_STEP_S = 0.004;
/** A long frame (tab throttling, GC pause) should not be integrated in full. */
const MAX_STEP_S = 0.25;

export interface BodyState {
  value: number;
  velocity: number;
}

/**
 * Critically-*under*-damped spring toward `target`, integrated at a fixed
 * 4ms sub-step so the same elapsed time always covers the same distance.
 *
 * A first-order follower is monotonic by construction — it can only approach
 * its target asymptotically, which is why the old turn read as interpolated
 * rather than breathed. A real breath overshoots a hair at the top.
 */
export function stepBody(state: BodyState, target: number, dtSeconds: number): BodyState {
  let { value, velocity } = state;
  let remaining = Math.min(Math.max(dtSeconds, 0), MAX_STEP_S);

  while (remaining > 0) {
    const h = Math.min(SUB_STEP_S, remaining);
    remaining -= h;
    const accel =
      BODY_OMEGA_N * BODY_OMEGA_N * (target - value) - 2 * BODY_ZETA * BODY_OMEGA_N * velocity;
    velocity += accel * h;
    value += velocity * h;
  }

  return { value: Math.min(value, LEVEL_GUARD), velocity };
}

/** Luminance trails the body: the orb fills, *then* it glows (~180ms later). */
export const LUM_TAU_S = 0.22;
/** The near air, ~190ms behind the body. */
export const NEAR_TAU_S = 0.19;
/**
 * The room, ~440ms behind. The medium breathes wider and later than the body
 * — this is the difference between an object and an object in air.
 */
export const FAR_TAU_S = 0.44;
/** The exhale channel lags too, so the deepening continues into the hold. */
export const DEPTH_TAU_S = 0.3;

/** Deterministic 0..1 from an integer. No Math.random: the loop must replay. */
export function hash01(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

/**
 * Per-cycle amplitude jitter, ±1.15%, so the loop is never machine-stamped.
 *
 * Applied to DRAWN amplitude only — never to engine timing. A breath pacer
 * that wobbles its own phase boundaries would be lying about the breath, so
 * there is a test asserting the engine's output is bit-identical with and
 * without this.
 */
export function wobble(cycles: number): number {
  return 0.9885 + 0.023 * hash01(cycles);
}

/** Reduced motion keeps a real, monotonic size cue — 1.15x in area, not none. */
export const REDUCED_MIN_SCALE = 0.9;
/** First-order glide for reduced motion: no overshoot, no spring. */
export const REDUCED_TAU_S = 0.2;
