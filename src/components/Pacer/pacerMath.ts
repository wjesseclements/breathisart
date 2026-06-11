import type { Phase, PhaseKind } from '../../engine/patterns';

/** Sinusoidal breath easing (PRD §4): organic, not linear, not springy. */
export function easeBreath(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

/**
 * How "full" the breath is right now: 0 = fully contracted, 1 = fully
 * expanded. Holds keep whatever level the preceding inhale/exhale reached
 * (wrapping around the pattern if the hold comes first).
 */
export function breathLevel(phases: readonly Phase[], phaseIndex: number, t: number): number {
  const phase = phases[phaseIndex];
  if (phase.kind === 'inhale') return easeBreath(t);
  if (phase.kind === 'exhale') return 1 - easeBreath(t);
  const n = phases.length;
  for (let back = 1; back <= n; back += 1) {
    const prev = phases[(((phaseIndex - back) % n) + n) % n];
    if (prev.kind === 'inhale') return 1;
    if (prev.kind === 'exhale') return 0;
  }
  return 0.5; // a pattern of only holds
}

const WORDS: Record<PhaseKind, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
};

export function phaseWord(phase: Phase): string {
  return phase.label ?? WORDS[phase.kind];
}
