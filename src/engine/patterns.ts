export type PhaseKind = 'inhale' | 'hold' | 'exhale';

export interface Phase {
  kind: PhaseKind;
  /** 0.5–60, decimals allowed (e.g. 5.5s coherent breathing). */
  seconds: number;
  /** Display override, e.g. "Top-off sip" for the sigh's second inhale. */
  label?: string;
}

export interface BreathPattern {
  id: string;
  name: string;
  tagline: string;
  phases: Phase[];
  cycleSuggestion?: string;
  builtIn: boolean;
  /** Short name for the picker chips, e.g. "Box" for "Box Breathing". */
  chipLabel?: string;
}

export function findPatternById(id: string): BreathPattern | undefined {
  return BUILT_IN_PATTERNS.find((p) => p.id === id);
}

/** Looks up a pattern among built-ins plus extras (e.g. saved customs). */
export function resolvePattern(
  id: string,
  extras: readonly BreathPattern[],
): BreathPattern | undefined {
  return findPatternById(id) ?? extras.find((p) => p.id === id);
}

const KIND_SHORT: Record<PhaseKind, string> = { inhale: 'in', hold: 'hold', exhale: 'out' };

/** Compact phase summary, e.g. "in 4 · hold 7 · out 8" — used as the tagline for custom patterns. */
export function describePhases(phases: readonly Phase[]): string {
  return phases.map((p) => `${KIND_SHORT[p.kind]} ${p.seconds}`).join(' · ');
}

export const MIN_PHASE_SECONDS = 0.5;
export const MAX_PHASE_SECONDS = 60;

/** Returns a list of human-readable problems; empty array means valid. */
export function validatePhases(phases: readonly Phase[]): string[] {
  const errors: string[] = [];
  if (phases.length === 0) {
    errors.push('A pattern needs at least one phase.');
  }
  phases.forEach((phase, i) => {
    const n = i + 1;
    if (!Number.isFinite(phase.seconds)) {
      errors.push(`Phase ${n}: duration must be a number.`);
    } else if (phase.seconds < MIN_PHASE_SECONDS) {
      errors.push(`Phase ${n}: duration must be at least ${MIN_PHASE_SECONDS}s.`);
    } else if (phase.seconds > MAX_PHASE_SECONDS) {
      errors.push(`Phase ${n}: duration cannot exceed ${MAX_PHASE_SECONDS}s.`);
    }
  });
  return errors;
}

export const BUILT_IN_PATTERNS: BreathPattern[] = [
  {
    id: 'box',
    chipLabel: 'Box',
    name: 'Box Breathing',
    tagline: 'Equal sides — steady composure under pressure',
    phases: [
      { kind: 'inhale', seconds: 4 },
      { kind: 'hold', seconds: 4 },
      { kind: 'exhale', seconds: 4 },
      { kind: 'hold', seconds: 4 },
    ],
    cycleSuggestion: 'Try 5 minutes',
    builtIn: true,
  },
  {
    id: '478',
    chipLabel: '4-7-8',
    name: '4-7-8',
    tagline: 'Relaxing breath — long hold, longer exhale',
    phases: [
      { kind: 'inhale', seconds: 4 },
      { kind: 'hold', seconds: 7 },
      { kind: 'exhale', seconds: 8 },
    ],
    cycleSuggestion: 'Start with 2–4 cycles',
    builtIn: true,
  },
  {
    id: 'coherent',
    chipLabel: 'Coherent',
    name: 'Coherent Breathing',
    tagline: 'About 5.5 breaths per minute, no holds',
    phases: [
      { kind: 'inhale', seconds: 5.5 },
      { kind: 'exhale', seconds: 5.5 },
    ],
    cycleSuggestion: 'Try 5–10 minutes',
    builtIn: true,
  },
  {
    id: 'calm',
    chipLabel: 'Calm',
    name: 'Extended Exhale',
    tagline: 'Gentle starter — exhale a little longer than you inhale',
    phases: [
      { kind: 'inhale', seconds: 4 },
      { kind: 'exhale', seconds: 6 },
    ],
    cycleSuggestion: 'Try 3–5 minutes',
    builtIn: true,
  },
  {
    id: 'sigh',
    chipLabel: 'Sigh',
    name: 'Physiological Sigh',
    tagline: 'Two inhales through the nose, one long exhale',
    phases: [
      { kind: 'inhale', seconds: 3 },
      { kind: 'inhale', seconds: 1.5, label: 'Top-off sip' },
      { kind: 'exhale', seconds: 6 },
    ],
    cycleSuggestion: 'Even 1–3 cycles can help',
    builtIn: true,
  },
];
