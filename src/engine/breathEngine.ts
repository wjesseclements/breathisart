import type { BreathPattern, Phase } from './patterns';
import { validatePhases } from './patterns';

/**
 * `leading` is the settling beat before the first inhale. It is a real engine
 * state rather than a component timer, so it runs on the one clock, carries
 * its remainder into the first phase exactly as a phase boundary does, and
 * inherits the same drift test.
 */
export type EngineStatus = 'idle' | 'leading' | 'running' | 'paused' | 'closing';

/** How long the closing sequence runs before the engine returns to idle. */
export const CLOSE_SECONDS = 2.2;

export interface EngineSnapshot {
  status: EngineStatus;
  phaseIndex: number;
  phase: Phase;
  /** Progress through the current phase, 0..1. */
  t: number;
  /** Seconds of active breathing this session (pauses excluded). */
  elapsed: number;
  /** Completed full cycles through the pattern. */
  cycles: number;
  /** Seconds left in the lead-in; 0 unless `status === 'leading'`. */
  leadRemaining: number;
  /** 0..1 through the closing sequence; 0 unless `status === 'closing'`. */
  closeProgress: number;
}

export interface EngineOptions {
  /**
   * Settling beat before the first inhale. 0 skips the state entirely rather
   * than running a zero-length one. Resolution order is caller > pattern > 3s,
   * and the physiological sigh sets 0 because it is the panic-button pattern.
   */
  leadInSeconds?: number;
}

export interface BreathEngine {
  readonly pattern: BreathPattern;
  start(nowMs: number): EngineSnapshot;
  /** Cut the lead-in short and begin the first inhale now. */
  skipLeadIn(): EngineSnapshot;
  /**
   * Begin the closing sequence. The clock keeps ticking for CLOSE_SECONDS so
   * the orb can ease out through its follower instead of snapping, then the
   * engine returns to idle on its own. `elapsed` and `cycles` freeze, so the
   * summary reads the session's real totals.
   */
  close(nowMs: number): EngineSnapshot;
  pause(nowMs: number): EngineSnapshot;
  resume(nowMs: number): EngineSnapshot;
  stop(): EngineSnapshot;
  /** Advance the clock. Call once per animation frame with a monotonic timestamp. */
  tick(nowMs: number): EngineSnapshot;
  getSnapshot(): EngineSnapshot;
}

/**
 * The single clock for all breath timing. Time is injected (monotonic ms,
 * e.g. performance.now()) so the engine is deterministic and unit-testable;
 * the UI drives it from one requestAnimationFrame loop.
 */
export function createBreathEngine(
  pattern: BreathPattern,
  options: EngineOptions = {},
): BreathEngine {
  const errors = validatePhases(pattern.phases);
  if (errors.length > 0) {
    throw new Error(`Invalid pattern "${pattern.id}": ${errors.join(' ')}`);
  }
  const phases = pattern.phases;
  const leadInSeconds = Math.max(0, options.leadInSeconds ?? pattern.leadInSeconds ?? 0);

  let status: EngineStatus = 'idle';
  let leadElapsed = 0;
  let closeElapsed = 0;
  /** What to return to on resume, so pausing mid-lead-in keeps the lead-in. */
  let pausedFrom: 'leading' | 'running' = 'running';
  let phaseIndex = 0;
  let phaseElapsed = 0; // seconds into the current phase
  let elapsed = 0;
  let cycles = 0;
  let lastNowMs = 0;

  function snapshot(): EngineSnapshot {
    return {
      status,
      phaseIndex,
      phase: phases[phaseIndex],
      t: phaseElapsed / phases[phaseIndex].seconds,
      elapsed,
      cycles,
      leadRemaining: status === 'leading' ? Math.max(0, leadInSeconds - leadElapsed) : 0,
      closeProgress: status === 'closing' ? Math.min(1, closeElapsed / CLOSE_SECONDS) : 0,
    };
  }

  function advance(deltaSeconds: number): void {
    if (status === 'closing') {
      // Time passes so the visuals can ease, but nothing about the breath
      // advances: elapsed and cycles are the session's final totals.
      closeElapsed += deltaSeconds;
      if (closeElapsed >= CLOSE_SECONDS) {
        status = 'idle';
        phaseIndex = 0;
        phaseElapsed = 0;
      }
      return;
    }
    if (status === 'leading') {
      leadElapsed += deltaSeconds;
      if (leadElapsed < leadInSeconds) return;
      // Carry the remainder into the first phase, exactly as a phase boundary
      // does, so there is no hitch at the hand-off.
      const overflow = leadElapsed - leadInSeconds;
      status = 'running';
      leadElapsed = leadInSeconds;
      if (overflow <= 0) return;
      deltaSeconds = overflow;
    }
    elapsed += deltaSeconds;
    phaseElapsed += deltaSeconds;
    // Carry the remainder across each boundary so long sessions never drift.
    while (phaseElapsed >= phases[phaseIndex].seconds) {
      phaseElapsed -= phases[phaseIndex].seconds;
      phaseIndex += 1;
      if (phaseIndex === phases.length) {
        phaseIndex = 0;
        cycles += 1;
      }
    }
  }

  return {
    pattern,

    start(nowMs) {
      status = leadInSeconds > 0 ? 'leading' : 'running';
      phaseIndex = 0;
      phaseElapsed = 0;
      elapsed = 0;
      cycles = 0;
      leadElapsed = 0;
      closeElapsed = 0;
      pausedFrom = 'running';
      lastNowMs = nowMs;
      return snapshot();
    },

    close(nowMs) {
      if (status === 'running' || status === 'leading') {
        advance(Math.max(0, nowMs - lastNowMs) / 1000);
      }
      if (status !== 'idle') {
        status = 'closing';
        closeElapsed = 0;
        lastNowMs = nowMs;
      }
      return snapshot();
    },

    skipLeadIn() {
      if (status === 'leading') {
        status = 'running';
        leadElapsed = leadInSeconds;
      }
      return snapshot();
    },

    pause(nowMs) {
      if (status === 'running' || status === 'leading') {
        advance(Math.max(0, nowMs - lastNowMs) / 1000);
        // `advance` may have completed the lead-in on this very tick.
        pausedFrom = status === 'leading' ? 'leading' : 'running';
        status = 'paused';
      }
      return snapshot();
    },

    resume(nowMs) {
      if (status === 'paused') {
        status = pausedFrom;
        lastNowMs = nowMs; // the paused gap is not counted
      }
      return snapshot();
    },

    stop() {
      status = 'idle';
      phaseIndex = 0;
      phaseElapsed = 0;
      leadElapsed = 0;
      closeElapsed = 0;
      return snapshot();
    },

    tick(nowMs) {
      if (status === 'running' || status === 'leading' || status === 'closing') {
        advance(Math.max(0, nowMs - lastNowMs) / 1000);
        lastNowMs = nowMs;
      }
      return snapshot();
    },

    getSnapshot: snapshot,
  };
}
