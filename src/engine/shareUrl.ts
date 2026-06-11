import type { BreathPattern, Phase, PhaseKind } from './patterns';
import { validatePhases } from './patterns';

const KIND_TO_TOKEN: Record<PhaseKind, string> = { inhale: 'in', hold: 'h', exhale: 'out' };
const TOKEN_TO_KIND: Record<string, PhaseKind> = { in: 'inhale', h: 'hold', out: 'exhale' };
const TOKEN_RE = /^(in|h|out)(\d+(?:\.\d+)?)$/;

/** "in4-h7-out8" style encoding (PRD §7). Labels are not encoded. */
export function encodePhases(phases: readonly Phase[]): string {
  return phases.map((p) => `${KIND_TO_TOKEN[p.kind]}${p.seconds}`).join('-');
}

/**
 * Decodes a `?p=` value back into phases. Returns null for anything
 * malformed or failing the shared engine validation (≥0.5s, ≤60s).
 */
export function decodePhases(encoded: string): Phase[] | null {
  if (encoded === '') return null;
  const phases: Phase[] = [];
  for (const part of encoded.split('-')) {
    const match = TOKEN_RE.exec(part);
    if (!match) return null;
    phases.push({ kind: TOKEN_TO_KIND[match[1]], seconds: Number(match[2]) });
  }
  return validatePhases(phases).length === 0 ? phases : null;
}

/** Path + query for sharing, e.g. "/?p=in4-h7-out8&n=Evening%20calm". */
export function buildSharePath(pattern: BreathPattern): string {
  const name = pattern.name.trim();
  const suffix = name ? `&n=${encodeURIComponent(name)}` : '';
  return `/?p=${encodePhases(pattern.phases)}${suffix}`;
}
