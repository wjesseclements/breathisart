import type { BreathPattern, Phase } from './patterns';
import { validatePhases } from './patterns';

export type EngineStatus = 'idle' | 'running' | 'paused';

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
}

export interface BreathEngine {
  readonly pattern: BreathPattern;
  start(nowMs: number): EngineSnapshot;
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
export function createBreathEngine(pattern: BreathPattern): BreathEngine {
  const errors = validatePhases(pattern.phases);
  if (errors.length > 0) {
    throw new Error(`Invalid pattern "${pattern.id}": ${errors.join(' ')}`);
  }
  const phases = pattern.phases;

  let status: EngineStatus = 'idle';
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
    };
  }

  function advance(deltaSeconds: number): void {
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
      status = 'running';
      phaseIndex = 0;
      phaseElapsed = 0;
      elapsed = 0;
      cycles = 0;
      lastNowMs = nowMs;
      return snapshot();
    },

    pause(nowMs) {
      if (status === 'running') {
        advance(Math.max(0, nowMs - lastNowMs) / 1000);
        status = 'paused';
      }
      return snapshot();
    },

    resume(nowMs) {
      if (status === 'paused') {
        status = 'running';
        lastNowMs = nowMs; // the paused gap is not counted
      }
      return snapshot();
    },

    stop() {
      status = 'idle';
      phaseIndex = 0;
      phaseElapsed = 0;
      return snapshot();
    },

    tick(nowMs) {
      if (status === 'running') {
        advance(Math.max(0, nowMs - lastNowMs) / 1000);
        lastNowMs = nowMs;
      }
      return snapshot();
    },

    getSnapshot: snapshot,
  };
}
