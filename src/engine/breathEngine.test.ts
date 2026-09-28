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

describe('lead-in', () => {
  const box = BUILT_IN_PATTERNS[0];

  it('starts in `leading` and counts down, holding phase state at zero', () => {
    const e = createBreathEngine(box, { leadInSeconds: 3 });
    expect(e.start(0).status).toBe('leading');
    const mid = e.tick(1200);
    expect(mid.status).toBe('leading');
    expect(mid.leadRemaining).toBeCloseTo(1.8, 5);
    expect(mid.elapsed).toBe(0);
    expect(mid.phaseIndex).toBe(0);
    expect(mid.t).toBe(0);
  });

  it('carries the remainder into the first phase, exactly like a boundary', () => {
    const e = createBreathEngine(box, { leadInSeconds: 3 });
    e.start(0);
    // One 3.5s step: 3s of lead-in, then 0.5s of the first inhale.
    const snap = e.tick(3500);
    expect(snap.status).toBe('running');
    expect(snap.elapsed).toBeCloseTo(0.5, 6);
    expect(snap.t).toBeCloseTo(0.5 / 4, 6);
  });

  it('skips the state entirely when the lead-in is zero', () => {
    const e = createBreathEngine(box, { leadInSeconds: 0 });
    expect(e.start(0).status).toBe('running');
    expect(e.tick(1000).elapsed).toBeCloseTo(1, 6);
  });

  it('honours a pattern-level override — the sigh is instant', () => {
    const sigh = BUILT_IN_PATTERNS.find((p) => p.id === 'sigh');
    expect(sigh?.leadInSeconds).toBe(0);
    const e = createBreathEngine(sigh!, { leadInSeconds: 3 });
    // The pattern's own 0 is applied by the caller (useBreathSession); the
    // engine still honours an explicit option, so assert the pattern value
    // reaches the engine when no option is given.
    expect(createBreathEngine(sigh!).start(0).status).toBe('running');
    expect(e.start(0).status).toBe('leading');
  });

  it('skipLeadIn jumps straight to the first inhale', () => {
    const e = createBreathEngine(box, { leadInSeconds: 3 });
    e.start(0);
    e.tick(500);
    const snap = e.skipLeadIn();
    expect(snap.status).toBe('running');
    expect(snap.elapsed).toBe(0);
    expect(e.tick(1500).elapsed).toBeCloseTo(1, 6);
  });

  it('pausing mid-lead-in resumes into the lead-in, not past it', () => {
    const e = createBreathEngine(box, { leadInSeconds: 3 });
    e.start(0);
    e.tick(1000);
    expect(e.pause(1000).status).toBe('paused');
    const resumed = e.resume(9000);
    expect(resumed.status).toBe('leading');
    expect(resumed.leadRemaining).toBeCloseTo(2, 5);
  });

  it('does not add drift: 20 minutes with a lead-in still lands cleanly', () => {
    const e = createBreathEngine(box, { leadInSeconds: 3 });
    e.start(0);
    const end = 3000 + 20 * 60 * 1000;
    for (let ms = 16; ms < end; ms += 16) e.tick(ms);
    const snap = e.tick(end); // land exactly on the endpoint, not 8ms short of it
    // 20 min of box breathing at 16s per cycle, the lead-in excluded from elapsed.
    expect(snap.elapsed).toBeCloseTo(20 * 60, 6);
    expect(snap.cycles).toBe((20 * 60) / 16);
  });
});
