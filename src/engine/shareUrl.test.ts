import { describe, expect, it } from 'vitest';
import { BUILT_IN_PATTERNS } from './patterns';
import { buildSharePath, decodePhases, encodePhases } from './shareUrl';

describe('encodePhases / decodePhases', () => {
  it('round-trips every built-in pattern (kinds and seconds)', () => {
    for (const pattern of BUILT_IN_PATTERNS) {
      const decoded = decodePhases(encodePhases(pattern.phases));
      expect(decoded).not.toBeNull();
      expect(decoded!.map((p) => ({ kind: p.kind, seconds: p.seconds }))).toEqual(
        pattern.phases.map((p) => ({ kind: p.kind, seconds: p.seconds })),
      );
    }
  });

  it('encodes the PRD example and the double-inhale sigh', () => {
    expect(
      encodePhases([
        { kind: 'inhale', seconds: 4 },
        { kind: 'hold', seconds: 7 },
        { kind: 'exhale', seconds: 8 },
      ]),
    ).toBe('in4-h7-out8');
    const sigh = BUILT_IN_PATTERNS.find((p) => p.id === 'sigh')!;
    expect(encodePhases(sigh.phases)).toBe('in3-in1.5-out6');
  });

  it('decodes decimals and repeated kinds', () => {
    expect(decodePhases('in5.5-out5.5')).toEqual([
      { kind: 'inhale', seconds: 5.5 },
      { kind: 'exhale', seconds: 5.5 },
    ]);
    expect(decodePhases('in3-in1.5-out6')).toHaveLength(3);
  });

  it('rejects malformed input', () => {
    for (const bad of ['', 'banana', 'in4-', '-in4', 'in4--out5', 'xx4', 'in', 'in4.5.5', 'in-4']) {
      expect(decodePhases(bad), bad).toBeNull();
    }
  });

  it('rejects values failing engine validation', () => {
    expect(decodePhases('in0-out4')).toBeNull(); // 0s phase
    expect(decodePhases('in0.4')).toBeNull(); // below 0.5s minimum
    expect(decodePhases('in999')).toBeNull(); // above 60s cap
  });
});

describe('buildSharePath', () => {
  it('includes the encoded phases and the name', () => {
    const calm = BUILT_IN_PATTERNS.find((p) => p.id === 'calm')!;
    expect(buildSharePath(calm)).toBe('/?p=in4-out6&n=Extended%20Exhale');
  });

  it('omits the name suffix for unnamed patterns', () => {
    const calm = BUILT_IN_PATTERNS.find((p) => p.id === 'calm')!;
    expect(buildSharePath({ ...calm, name: '  ' })).toBe('/?p=in4-out6');
  });
});
