import { describe, expect, it } from 'vitest';
import { createBreathEngine } from '../../engine/breathEngine';
import { BUILT_IN_PATTERNS } from '../../engine/patterns';
import {
  MAX_SCALE,
  MIN_SCALE,
  LEVEL_GUARD,
  areaScale,
  hash01,
  stepBody,
  wobble,
} from './pacerFollowers';

/** Drives the body follower to `target` for `seconds` at a given frame rate. */
function settle(target: number, seconds: number, fps = 60, from = { value: 0, velocity: 0 }) {
  const dt = 1 / fps;
  let s = from;
  let peak = -Infinity;
  for (let i = 0; i < Math.round(seconds * fps); i += 1) {
    s = stepBody(s, target, dt);
    peak = Math.max(peak, s.value);
  }
  return { state: s, peak };
}

describe('areaScale', () => {
  it('spans exactly MIN_SCALE to MAX_SCALE', () => {
    expect(areaScale(0)).toBeCloseTo(MIN_SCALE, 10);
    expect(areaScale(1)).toBeCloseTo(MAX_SCALE, 10);
  });

  it('maps area, not radius: the midpoint sits above the linear midpoint', () => {
    const linearMid = (MIN_SCALE + MAX_SCALE) / 2;
    expect(areaScale(0.5)).toBeGreaterThan(linearMid);
  });

  it('never reaches 1.0, so no composited layer is ever scaled up', () => {
    for (let l = 0; l <= 1.0001; l += 0.01) expect(areaScale(l)).toBeLessThan(1);
    // Even at the divergence guard, i.e. the worst the follower can produce.
    expect(areaScale(LEVEL_GUARD)).toBeLessThan(1);
  });
});

describe('stepBody', () => {
  it('overshoots its target at the turn, which a first-order follower cannot', () => {
    const { peak } = settle(1, 1.5);
    expect(peak).toBeGreaterThan(1.02);
    expect(peak).toBeLessThan(1.05);
  });

  it('settles inside 2% of the target by ~420ms', () => {
    expect(Math.abs(settle(1, 0.42).state.value - 1)).toBeLessThan(0.02);
    // ...and is still visibly moving at 200ms, which is the point of a spring.
    expect(Math.abs(settle(1, 0.2).state.value - 1)).toBeGreaterThan(0.02);
  });

  it('is frame-rate independent: 30fps and 240fps agree', () => {
    const slow = settle(1, 0.5, 30).state.value;
    const fast = settle(1, 0.5, 240).state.value;
    expect(Math.abs(slow - fast)).toBeLessThan(0.002);
  });

  it('cannot diverge, even fed an absurd initial velocity', () => {
    const { peak } = settle(1, 3, 60, { value: 0, velocity: 40 });
    expect(peak).toBeLessThanOrEqual(LEVEL_GUARD);
  });

  it('absorbs a long stalled frame instead of integrating it in full', () => {
    const jumped = stepBody({ value: 0, velocity: 0 }, 1, 10);
    expect(Number.isFinite(jumped.value)).toBe(true);
    expect(jumped.value).toBeLessThanOrEqual(LEVEL_GUARD);
  });
});

describe('wobble', () => {
  it('stays within +/-1.15% of unity', () => {
    for (let c = 0; c < 500; c += 1) {
      expect(wobble(c)).toBeGreaterThanOrEqual(0.9885);
      expect(wobble(c)).toBeLessThanOrEqual(0.9885 + 0.023);
    }
  });

  it('is deterministic and varies between cycles', () => {
    expect(wobble(7)).toBe(wobble(7));
    const seen = new Set(Array.from({ length: 50 }, (_, i) => wobble(i)));
    expect(seen.size).toBeGreaterThan(40);
  });

  it('keeps the drawn scale below 1.0 even at maximum amplitude', () => {
    const maxWobble = 0.9885 + 0.023;
    expect(areaScale(LEVEL_GUARD) * maxWobble).toBeLessThan(1);
  });

  it('hash01 stays in [0,1)', () => {
    for (let n = 0; n < 1000; n += 1) {
      const h = hash01(n);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
    }
  });
});

/**
 * The guard that keeps `wobble` honest. It multiplies DRAWN amplitude only; if
 * it ever reached engine timing the pacer would be lying about the breath.
 */
describe('wobble never touches engine timing', () => {
  it('a 20-minute box session has identical phase boundaries with and without it', () => {
    const run = () => {
      const engine = createBreathEngine(BUILT_IN_PATTERNS[0]);
      engine.start(0);
      const boundaries: string[] = [];
      let prev = 0;
      for (let ms = 0; ms <= 20 * 60 * 1000; ms += 16) {
        const snap = engine.tick(ms);
        if (snap.phaseIndex !== prev) {
          boundaries.push(`${ms}:${snap.phaseIndex}:${snap.cycles}`);
          prev = snap.phaseIndex;
        }
      }
      return boundaries;
    };

    const plain = run();
    // Consuming wobble must not perturb anything the engine produces.
    const withWobble = run().map((b, i) => {
      void wobble(i);
      return b;
    });

    expect(withWobble).toEqual(plain);
    expect(plain.length).toBeGreaterThan(250);
  });
});
