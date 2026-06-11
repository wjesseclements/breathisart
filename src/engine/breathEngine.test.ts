import { describe, expect, it } from 'vitest';
import { createBreathEngine } from './breathEngine';
import type { BreathPattern } from './patterns';
import { BUILT_IN_PATTERNS } from './patterns';

const box = BUILT_IN_PATTERNS.find((p) => p.id === 'box')!;
const sigh = BUILT_IN_PATTERNS.find((p) => p.id === 'sigh')!;

const pattern = (phases: BreathPattern['phases']): BreathPattern => ({
  id: 'test',
  name: 'Test',
  tagline: '',
  phases,
  builtIn: false,
});

describe('createBreathEngine', () => {
  it('rejects invalid patterns at creation', () => {
    expect(() => createBreathEngine(pattern([]))).toThrow(/at least one phase/);
    expect(() => createBreathEngine(pattern([{ kind: 'inhale', seconds: 0 }]))).toThrow();
  });

  it('starts idle at phase 0 with t = 0', () => {
    const engine = createBreathEngine(box);
    const snap = engine.getSnapshot();
    expect(snap).toMatchObject({ status: 'idle', phaseIndex: 0, t: 0, elapsed: 0, cycles: 0 });
  });
});

describe('phase sequencing', () => {
  it('walks box phases in order and counts cycles', () => {
    const engine = createBreathEngine(box);
    engine.start(0);
    expect(engine.tick(2_000)).toMatchObject({ phaseIndex: 0, t: 0.5 }); // 2s into inhale 4
    expect(engine.tick(5_000)).toMatchObject({ phaseIndex: 1 }); // hold
    expect(engine.tick(9_000)).toMatchObject({ phaseIndex: 2 }); // exhale
    expect(engine.tick(13_000)).toMatchObject({ phaseIndex: 3 }); // hold
    const wrapped = engine.tick(16_000); // 16s = full cycle
    expect(wrapped).toMatchObject({ phaseIndex: 0, t: 0, cycles: 1 });
  });

  it('handles the sigh double-inhale sequence', () => {
    const engine = createBreathEngine(sigh);
    engine.start(0);
    expect(engine.tick(1_000).phase.kind).toBe('inhale');
    const secondSip = engine.tick(3_500);
    expect(secondSip.phase.kind).toBe('inhale');
    expect(secondSip.phase.label).toBe('Top-off sip');
    expect(engine.tick(5_000).phase.kind).toBe('exhale');
  });

  it('a single large tick spanning several phases lands correctly', () => {
    const engine = createBreathEngine(box);
    engine.start(0);
    // 13.2s into a 4/4/4/4 cycle = phase 3, 1.2s in
    const snap = engine.tick(13_200);
    expect(snap.phaseIndex).toBe(3);
    expect(snap.t).toBeCloseTo(1.2 / 4, 10);
  });

  it('carries the remainder across phase boundaries', () => {
    const engine = createBreathEngine(box);
    engine.start(0);
    engine.tick(3_900); // 0.1s before the boundary
    const snap = engine.tick(4_300); // 0.3s past it
    expect(snap.phaseIndex).toBe(1);
    expect(snap.t).toBeCloseTo(0.3 / 4, 10);
  });
});

describe('pause / resume', () => {
  it('freezes progress exactly and restores it on resume', () => {
    const engine = createBreathEngine(box);
    engine.start(0);
    engine.tick(2_500);
    const atPause = engine.pause(2_600); // pause counts time up to the pause call
    expect(atPause.t).toBeCloseTo(2.6 / 4, 10);

    // Ticks while paused change nothing.
    const whilePaused = engine.tick(60_000);
    expect(whilePaused).toEqual({ ...atPause, status: 'paused' });

    // The paused gap is not counted: resume at 100s, tick 0.4s later.
    engine.resume(100_000);
    const after = engine.tick(100_400);
    expect(after.t).toBeCloseTo(3.0 / 4, 10);
    expect(after.elapsed).toBeCloseTo(3.0, 10);
  });

  it('pause and resume are no-ops in the wrong states', () => {
    const engine = createBreathEngine(box);
    expect(engine.pause(1_000).status).toBe('idle');
    expect(engine.resume(1_000).status).toBe('idle');
    engine.start(0);
    expect(engine.resume(5_000).status).toBe('running');
    expect(engine.tick(1_000).t).toBeCloseTo(0.25, 10); // resume didn't reset the clock
  });
});

describe('long-session accuracy', () => {
  it('does not drift over a simulated 20-minute session of uneven frames', () => {
    const engine = createBreathEngine(box);
    engine.start(0);

    // Simulate 20 minutes of frames with jittery durations (~60fps).
    const frameDurations = [16, 17, 16.6, 16.7, 18, 15.4]; // ms, sums to 99.7
    let nowMs = 0;
    let i = 0;
    while (nowMs < 20 * 60 * 1000) {
      nowMs += frameDurations[i % frameDurations.length];
      i += 1;
      engine.tick(nowMs);
    }

    const snap = engine.getSnapshot();
    const totalSeconds = nowMs / 1000;
    const cycleSeconds = 16; // box = 4+4+4+4

    // Elapsed must match injected time exactly (within float accumulation noise).
    expect(snap.elapsed).toBeCloseTo(totalSeconds, 6);

    // Position in the pattern must match the analytically computed position.
    expect(snap.cycles).toBe(Math.floor(totalSeconds / cycleSeconds));
    const expectedIntoCycle = totalSeconds % cycleSeconds;
    const expectedPhaseIndex = Math.floor(expectedIntoCycle / 4);
    const expectedT = (expectedIntoCycle % 4) / 4;
    expect(snap.phaseIndex).toBe(expectedPhaseIndex);
    expect(snap.t).toBeCloseTo(expectedT, 6);
  });

  it('stays exact with decimal phase durations (coherent 5.5/5.5)', () => {
    const coherent = BUILT_IN_PATTERNS.find((p) => p.id === 'coherent')!;
    const engine = createBreathEngine(coherent);
    engine.start(0);
    for (let nowMs = 16; nowMs <= 11_000 * 100; nowMs += 16) {
      engine.tick(nowMs);
    }
    // 1,100s = exactly 100 cycles of 11s
    const snap = engine.tick(1_100_000);
    expect(snap.cycles).toBe(100);
    expect(snap.t).toBeCloseTo(0, 6);
  });
});

describe('full session accounting', () => {
  it('reports elapsed and cycles through start → pause → resume → end', () => {
    const engine = createBreathEngine(box);
    engine.start(0);
    engine.tick(30_000);
    engine.pause(45_000); // 45s of active breathing
    engine.tick(60_000); // ignored while paused
    engine.resume(100_000);
    engine.tick(115_000); // +15s -> 60s total
    const end = engine.stop();
    expect(end.elapsed).toBeCloseTo(60, 10);
    expect(end.cycles).toBe(3); // 60s / 16s cycle = 3 complete + 0.75
  });
});

describe('stop and restart', () => {
  it('stop returns to idle but keeps session totals for the summary', () => {
    const engine = createBreathEngine(box);
    engine.start(0);
    engine.tick(33_000);
    const stopped = engine.stop();
    expect(stopped.status).toBe('idle');
    expect(stopped.phaseIndex).toBe(0);
    expect(stopped.elapsed).toBeCloseTo(33, 10);
    expect(stopped.cycles).toBe(2);
  });

  it('start resets everything for a fresh session', () => {
    const engine = createBreathEngine(box);
    engine.start(0);
    engine.tick(33_000);
    engine.stop();
    const fresh = engine.start(50_000);
    expect(fresh).toMatchObject({ status: 'running', phaseIndex: 0, t: 0, elapsed: 0, cycles: 0 });
  });

  it('ticks while idle do not advance anything', () => {
    const engine = createBreathEngine(box);
    const snap = engine.tick(10_000);
    expect(snap).toMatchObject({ status: 'idle', t: 0, elapsed: 0 });
  });
});
