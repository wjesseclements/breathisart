import type { Phase, PhaseKind } from '../../engine/patterns';

/** Sinusoidal breath easing (PRD §4): organic, not linear, not springy. */
export function easeBreath(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

/** The [start, end] breath level a phase moves between. */
export interface LevelRange {
  start: number;
  end: number;
}

/**
 * Precomputes each phase's [start, end] breath level. A run of consecutive
 * same-kind phases shares the full 0↔1 range proportionally by duration —
 * the sigh's 3s inhale covers 0→2/3 and its 1.5s top-off 2/3→1, instead of
 * each restarting from 0. Holds keep whatever level the preceding
 * inhale/exhale run reached (wrapping around the pattern if the hold comes
 * first); a pattern of only holds settles mid-level.
 */
export function phaseLevelRanges(phases: readonly Phase[]): LevelRange[] {
  const n = phases.length;
  const ranges: LevelRange[] = new Array<LevelRange>(n);

  let i = 0;
  while (i < n) {
    const kind = phases[i].kind;
    if (kind === 'hold') {
      ranges[i] = { start: 0.5, end: 0.5 }; // resolved below once runs are known
      i += 1;
      continue;
    }
    let runEnd = i;
    let total = 0;
    while (runEnd < n && phases[runEnd].kind === kind) {
      total += phases[runEnd].seconds;
      runEnd += 1;
    }
    const from = kind === 'inhale' ? 0 : 1;
    const to = 1 - from;
    let covered = 0;
    for (let k = i; k < runEnd; k += 1) {
      const start = from + (to - from) * (covered / total);
      covered += phases[k].seconds;
      ranges[k] = { start, end: from + (to - from) * (covered / total) };
    }
    i = runEnd;
  }

  for (let idx = 0; idx < n; idx += 1) {
    if (phases[idx].kind !== 'hold') continue;
    for (let back = 1; back <= n; back += 1) {
      const prev = (((idx - back) % n) + n) % n;
      if (phases[prev].kind !== 'hold') {
        const level = ranges[prev].end;
        ranges[idx] = { start: level, end: level };
        break;
      }
    }
  }

  return ranges;
}

/**
 * How "full" the breath is right now: 0 = fully contracted, 1 = fully
 * expanded. Eases within the phase's precomputed level range (see
 * `phaseLevelRanges`; compute the ranges once per pattern, not per frame).
 */
export function breathLevel(ranges: readonly LevelRange[], phaseIndex: number, t: number): number {
  const { start, end } = ranges[phaseIndex];
  return start + (end - start) * easeBreath(t);
}

/** Time constant of the pacer's level follower: ~280ms to settle (≈4τ). */
export const LEVEL_FOLLOWER_TAU_S = 0.07;

/**
 * Moves a displayed level toward its target with frame-rate-independent
 * exponential smoothing (a critically-damped follower): the same elapsed
 * time covers the same distance no matter how many frames it spans, so the
 * orb glides through breathLevel's velocity kinks instead of jerking.
 */
export function followLevel(current: number, target: number, dtSeconds: number): number {
  return target + (current - target) * Math.exp(-dtSeconds / LEVEL_FOLLOWER_TAU_S);
}

const WORDS: Record<PhaseKind, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
};

export function phaseWord(phase: Phase): string {
  return phase.label ?? WORDS[phase.kind];
}
