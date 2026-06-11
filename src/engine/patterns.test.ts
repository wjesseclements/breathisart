import { describe, expect, it } from 'vitest';
import type { Phase } from './patterns';
import {
  BUILT_IN_PATTERNS,
  MAX_PHASE_SECONDS,
  MIN_PHASE_SECONDS,
  describePhases,
  findPatternById,
  resolvePattern,
  validatePhases,
} from './patterns';

const inhale = (seconds: number): Phase => ({ kind: 'inhale', seconds });

describe('built-in patterns', () => {
  it('ships the five patterns from the PRD', () => {
    expect(BUILT_IN_PATTERNS.map((p) => p.id)).toEqual(['box', '478', 'coherent', 'calm', 'sigh']);
  });

  it('all built-ins pass validation', () => {
    for (const pattern of BUILT_IN_PATTERNS) {
      expect(validatePhases(pattern.phases)).toEqual([]);
    }
  });

  it('the physiological sigh has two inhales (the schema must allow this)', () => {
    const sigh = BUILT_IN_PATTERNS.find((p) => p.id === 'sigh');
    expect(sigh?.phases.filter((p) => p.kind === 'inhale')).toHaveLength(2);
    expect(sigh?.phases[1].label).toBe('Top-off sip');
  });

  it('finds patterns by id and returns undefined for unknown ids', () => {
    expect(findPatternById('sigh')?.name).toBe('Physiological Sigh');
    expect(findPatternById('deleted-custom-pattern')).toBeUndefined();
  });

  it('resolvePattern searches built-ins first, then extras', () => {
    const custom = { ...BUILT_IN_PATTERNS[0], id: 'custom-1', name: 'Mine', builtIn: false };
    expect(resolvePattern('custom-1', [custom])?.name).toBe('Mine');
    expect(resolvePattern('box', [custom])?.builtIn).toBe(true);
    expect(resolvePattern('nope', [custom])).toBeUndefined();
  });

  it('describePhases summarizes phases compactly', () => {
    const box = BUILT_IN_PATTERNS.find((p) => p.id === 'box')!;
    const sigh = BUILT_IN_PATTERNS.find((p) => p.id === 'sigh')!;
    expect(describePhases(box.phases)).toBe('in 4 · hold 4 · out 4 · hold 4');
    expect(describePhases(sigh.phases)).toBe('in 3 · in 1.5 · out 6');
  });

  it('coherent breathing uses decimal seconds', () => {
    const coherent = BUILT_IN_PATTERNS.find((p) => p.id === 'coherent');
    expect(coherent?.phases.every((p) => p.seconds === 5.5)).toBe(true);
  });
});

describe('validatePhases', () => {
  it('requires at least one phase', () => {
    expect(validatePhases([])).toHaveLength(1);
  });

  it('rejects zero and negative durations', () => {
    expect(validatePhases([inhale(0)])).toHaveLength(1);
    expect(validatePhases([inhale(-3)])).toHaveLength(1);
  });

  it('rejects durations below the 0.5s minimum', () => {
    expect(validatePhases([inhale(0.4)])).toHaveLength(1);
    expect(validatePhases([inhale(MIN_PHASE_SECONDS)])).toEqual([]);
  });

  it('caps durations at 60s', () => {
    expect(validatePhases([inhale(MAX_PHASE_SECONDS)])).toEqual([]);
    expect(validatePhases([inhale(60.1)])).toHaveLength(1);
  });

  it('rejects non-finite durations', () => {
    expect(validatePhases([inhale(Number.NaN)])).toHaveLength(1);
    expect(validatePhases([inhale(Number.POSITIVE_INFINITY)])).toHaveLength(1);
  });

  it('accepts decimals and reports one error per bad phase', () => {
    expect(validatePhases([inhale(5.5), inhale(1.25)])).toEqual([]);
    expect(validatePhases([inhale(0), inhale(4), inhale(99)])).toHaveLength(2);
  });
});
