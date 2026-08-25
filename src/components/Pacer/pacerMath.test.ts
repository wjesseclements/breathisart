import { describe, expect, it } from 'vitest';
import type { Phase } from '../../engine/patterns';
import { breathLevel, easeBreath, followLevel, phaseLevelRanges, phaseWord } from './pacerMath';

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

describe('phaseLevelRanges', () => {
  it('gives lone inhales 0→1 and lone exhales 1→0', () => {
    expect(phaseLevelRanges([inhale, hold, exhale, hold]).slice(0, 3)).toEqual([
      { start: 0, end: 1 },
      { start: 1, end: 1 },
      { start: 1, end: 0 },
    ]);
  });

  it('splits the sigh across its two inhales proportionally by duration', () => {
    const sigh: Phase[] = [
      { kind: 'inhale', seconds: 3 },
      { kind: 'inhale', seconds: 1.5, label: 'Top-off sip' },
      { kind: 'exhale', seconds: 6 },
    ];
    const [first, topOff, out] = phaseLevelRanges(sigh);
    expect(first.start).toBeCloseTo(0, 10);
    expect(first.end).toBeCloseTo(2 / 3, 10);
    expect(topOff.start).toBeCloseTo(2 / 3, 10);
    expect(topOff.end).toBeCloseTo(1, 10);
    expect(out).toEqual({ start: 1, end: 0 });
  });

  it('splits a custom double exhale proportionally by duration', () => {
    const pattern: Phase[] = [
      { kind: 'inhale', seconds: 4 },
      { kind: 'exhale', seconds: 2 },
      { kind: 'exhale', seconds: 6 },
    ];
    const [, firstOut, secondOut] = phaseLevelRanges(pattern);
    expect(firstOut.start).toBeCloseTo(1, 10);
    expect(firstOut.end).toBeCloseTo(0.75, 10);
    expect(secondOut.start).toBeCloseTo(0.75, 10);
    expect(secondOut.end).toBeCloseTo(0, 10);
  });

  it('holds stay at the level the preceding run reached', () => {
    const ranges = phaseLevelRanges([inhale, hold, exhale, hold]);
    expect(ranges[1]).toEqual({ start: 1, end: 1 });
    expect(ranges[3]).toEqual({ start: 0, end: 0 });
  });

  it('a leading hold wraps around to the end of the pattern', () => {
    expect(phaseLevelRanges([hold, inhale, exhale])[0]).toEqual({ start: 0, end: 0 });
    expect(phaseLevelRanges([hold, exhale, inhale])[0]).toEqual({ start: 1, end: 1 });
  });

  it('an all-hold pattern settles mid-level', () => {
    expect(phaseLevelRanges([hold, hold])[0]).toEqual({ start: 0.5, end: 0.5 });
  });
});

describe('breathLevel', () => {
  const box = phaseLevelRanges([inhale, hold, exhale, hold]);

  it('rises through an inhale and falls through an exhale', () => {
    expect(breathLevel(box, 0, 0)).toBeCloseTo(0, 10);
    expect(breathLevel(box, 0, 1)).toBeCloseTo(1, 10);
    expect(breathLevel(box, 2, 0)).toBeCloseTo(1, 10);
    expect(breathLevel(box, 2, 1)).toBeCloseTo(0, 10);
  });

  it('holds stay flat regardless of t', () => {
    expect(breathLevel(box, 1, 0.5)).toBe(1);
    expect(breathLevel(box, 3, 0.5)).toBe(0);
  });

  it('eases within each phase of the sigh, joining ranges continuously', () => {
    const sigh = phaseLevelRanges([
      { kind: 'inhale', seconds: 3 },
      { kind: 'inhale', seconds: 1.5 },
      { kind: 'exhale', seconds: 6 },
    ]);
    expect(breathLevel(sigh, 0, 1)).toBeCloseTo(2 / 3, 10);
    expect(breathLevel(sigh, 1, 0)).toBeCloseTo(2 / 3, 10); // no jump at the boundary
    expect(breathLevel(sigh, 1, 0.5)).toBeCloseTo(2 / 3 + 1 / 6, 10); // eased midpoint
    expect(breathLevel(sigh, 1, 1)).toBeCloseTo(1, 10);
  });
});

describe('followLevel', () => {
  it('is frame-rate independent: many small steps equal one big step', () => {
    let stepped = 0;
    for (let i = 0; i < 28; i += 1) stepped = followLevel(stepped, 1, 0.01);
    expect(stepped).toBeCloseTo(followLevel(0, 1, 0.28), 10);
  });

  it('settles within ~2% of the target after ~280ms', () => {
    expect(followLevel(0, 1, 0.28)).toBeGreaterThan(0.98);
    expect(followLevel(1, 0, 0.28)).toBeLessThan(0.02);
  });

  it('never overshoots and stays put at the target', () => {
    expect(followLevel(0.4, 1, 10)).toBeCloseTo(1, 10);
    expect(followLevel(1, 1, 0.016)).toBe(1);
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
