import { describe, expect, it } from 'vitest';
import type { Phase } from '../../engine/patterns';
import { breathLevel, easeBreath, phaseWord } from './pacerMath';

const inhale: Phase = { kind: 'inhale', seconds: 4 };
const hold: Phase = { kind: 'hold', seconds: 4 };
const exhale: Phase = { kind: 'exhale', seconds: 4 };

describe('easeBreath', () => {
  it('starts at 0, ends at 1, passes through 0.5 at the midpoint', () => {
    expect(easeBreath(0)).toBeCloseTo(0, 10);
    expect(easeBreath(0.5)).toBeCloseTo(0.5, 10);
    expect(easeBreath(1)).toBeCloseTo(1, 10);
  });

  it('eases gently at both ends (slower than linear near 0 and 1)', () => {
    expect(easeBreath(0.1)).toBeLessThan(0.1);
    expect(easeBreath(0.9)).toBeGreaterThan(0.9);
  });
});

describe('breathLevel', () => {
  const box = [inhale, hold, exhale, hold];

  it('rises through an inhale and falls through an exhale', () => {
    expect(breathLevel(box, 0, 0)).toBeCloseTo(0, 10);
    expect(breathLevel(box, 0, 1)).toBeCloseTo(1, 10);
    expect(breathLevel(box, 2, 0)).toBeCloseTo(1, 10);
    expect(breathLevel(box, 2, 1)).toBeCloseTo(0, 10);
  });

  it('holds stay at the level they arrived at', () => {
    expect(breathLevel(box, 1, 0.5)).toBe(1); // hold after inhale
    expect(breathLevel(box, 3, 0.5)).toBe(0); // hold after exhale
  });

  it('a leading hold wraps around to the end of the pattern', () => {
    expect(breathLevel([hold, inhale, exhale], 0, 0.5)).toBe(0); // last non-hold is exhale
    expect(breathLevel([hold, exhale, inhale], 0, 0.5)).toBe(1);
  });

  it('an all-hold pattern settles mid-level', () => {
    expect(breathLevel([hold, hold], 0, 0.5)).toBe(0.5);
  });
});

describe('phaseWord', () => {
  it('maps phase kinds to words', () => {
    expect(phaseWord(inhale)).toBe('Breathe in');
    expect(phaseWord(hold)).toBe('Hold');
    expect(phaseWord(exhale)).toBe('Breathe out');
  });

  it('prefers the label override', () => {
    expect(phaseWord({ kind: 'inhale', seconds: 1.5, label: 'Top-off sip' })).toBe('Top-off sip');
  });
});
