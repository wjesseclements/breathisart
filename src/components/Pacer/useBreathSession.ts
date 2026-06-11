import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EngineSnapshot, EngineStatus } from '../../engine/breathEngine';
import { createBreathEngine } from '../../engine/breathEngine';
import type { BreathPattern, Phase } from '../../engine/patterns';

export type FrameListener = (snap: EngineSnapshot) => void;

interface DiscreteState {
  status: EngineStatus;
  phaseIndex: number;
  phase: Phase;
  cycles: number;
  /** Whole seconds of active breathing — updates once per second, not per frame. */
  elapsedSeconds: number;
}

export interface BreathSession extends DiscreteState {
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** idle → start, running → pause, paused → resume. */
  toggle: () => void;
  stop: () => void;
  /** Per-frame snapshots for imperative style updates; returns unsubscribe. */
  onFrame: (listener: FrameListener) => () => void;
}

const toDiscrete = (snap: EngineSnapshot): DiscreteState => ({
  status: snap.status,
  phaseIndex: snap.phaseIndex,
  phase: snap.phase,
  cycles: snap.cycles,
  elapsedSeconds: Math.floor(snap.elapsed),
});

const sameDiscrete = (prev: DiscreteState, snap: EngineSnapshot): boolean =>
  prev.status === snap.status &&
  prev.phaseIndex === snap.phaseIndex &&
  prev.phase === snap.phase &&
  prev.cycles === snap.cycles &&
  prev.elapsedSeconds === Math.floor(snap.elapsed);

/**
 * Bridges the breath engine to React. Owns the app's single rAF loop;
 * React state only changes on discrete transitions (status, phase, cycle)
 * while per-frame values flow to onFrame listeners for ref-based updates.
 */
export function useBreathSession(pattern: BreathPattern): BreathSession {
  const engine = useMemo(() => createBreathEngine(pattern), [pattern]);
  const [discrete, setDiscrete] = useState<DiscreteState>(() => toDiscrete(engine.getSnapshot()));
  const [prevEngine, setPrevEngine] = useState(engine);
  const listenersRef = useRef(new Set<FrameListener>());

  // A new engine (pattern change) resets the session state.
  if (prevEngine !== engine) {
    setPrevEngine(engine);
    setDiscrete(toDiscrete(engine.getSnapshot()));
  }

  const publish = useCallback((snap: EngineSnapshot) => {
    for (const listener of listenersRef.current) listener(snap);
    setDiscrete((prev) => (sameDiscrete(prev, snap) ? prev : toDiscrete(snap)));
  }, []);

  // The single rAF loop, alive only while the session is running.
  useEffect(() => {
    if (discrete.status !== 'running') return;
    let raf = 0;
    function step(frameNowMs: number) {
      const snap = engine.tick(frameNowMs);
      publish(snap);
      if (snap.status === 'running') raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [discrete.status, engine, publish]);

  const start = useCallback(() => publish(engine.start(performance.now())), [engine, publish]);
  const pause = useCallback(() => publish(engine.pause(performance.now())), [engine, publish]);
  const resume = useCallback(() => publish(engine.resume(performance.now())), [engine, publish]);
  const stop = useCallback(() => publish(engine.stop()), [engine, publish]);

  const toggle = useCallback(() => {
    if (discrete.status === 'idle') start();
    else if (discrete.status === 'running') pause();
    else resume();
  }, [discrete.status, start, pause, resume]);

  const onFrame = useCallback((listener: FrameListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return { ...discrete, start, pause, resume, toggle, stop, onFrame };
}
