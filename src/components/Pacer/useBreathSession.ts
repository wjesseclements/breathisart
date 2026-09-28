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
  /** Whole seconds left in the lead-in, for the "breathe in, in 3 / 2 / 1" count. */
  leadSeconds: number;
}

export interface BreathSession extends DiscreteState {
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** idle → start, leading → skip, running → pause, paused → resume. */
  toggle: () => void;
  /** Cut the settling beat short and begin the first inhale. */
  skipLeadIn: () => void;
  /** Ease out over ~2s and then return to idle, rather than cutting. */
  close: () => void;
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
  leadSeconds: Math.ceil(snap.leadRemaining),
});

const sameDiscrete = (prev: DiscreteState, snap: EngineSnapshot): boolean =>
  prev.status === snap.status &&
  prev.phaseIndex === snap.phaseIndex &&
  prev.phase === snap.phase &&
  prev.cycles === snap.cycles &&
  prev.elapsedSeconds === Math.floor(snap.elapsed) &&
  prev.leadSeconds === Math.ceil(snap.leadRemaining);

/**
 * Bridges the breath engine to React. Owns the app's single rAF loop;
 * React state only changes on discrete transitions (status, phase, cycle)
 * while per-frame values flow to onFrame listeners for ref-based updates.
 */
export function useBreathSession(pattern: BreathPattern, leadInSeconds?: number): BreathSession {
  // A pattern's own `leadInSeconds` wins over the user setting: the sigh is
  // the panic-button pattern and must stay instant.
  const lead = pattern.leadInSeconds ?? leadInSeconds;
  const engine = useMemo(
    () => createBreathEngine(pattern, { leadInSeconds: lead }),
    [pattern, lead],
  );
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
    // The loop runs for `leading` and `closing` too: both are on the same clock.
    if (
      discrete.status !== 'running' &&
      discrete.status !== 'leading' &&
      discrete.status !== 'closing'
    )
      return;
    let raf = 0;
    function step(frameNowMs: number) {
      const snap = engine.tick(frameNowMs);
      publish(snap);
      // Every state that advances the clock must keep asking for frames.
      // Omitting `closing` here stranded the closing sequence after a single
      // frame -- it never reached CLOSE_SECONDS, so the engine never returned
      // to idle and the summary never appeared.
      if (snap.status === 'running' || snap.status === 'leading' || snap.status === 'closing') {
        raf = requestAnimationFrame(step);
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [discrete.status, engine, publish]);

  const start = useCallback(() => publish(engine.start(performance.now())), [engine, publish]);
  const pause = useCallback(() => publish(engine.pause(performance.now())), [engine, publish]);
  const resume = useCallback(() => publish(engine.resume(performance.now())), [engine, publish]);
  const stop = useCallback(() => publish(engine.stop()), [engine, publish]);
  const skipLeadIn = useCallback(() => publish(engine.skipLeadIn()), [engine, publish]);
  const close = useCallback(() => publish(engine.close(performance.now())), [engine, publish]);

  const toggle = useCallback(() => {
    if (discrete.status === 'idle') start();
    // Tapping during the settling beat means "I'm ready" -- skip into the
    // inhale rather than pausing a countdown.
    else if (discrete.status === 'leading') skipLeadIn();
    else if (discrete.status === 'running') pause();
    else if (discrete.status === 'closing')
      return; // let the close finish
    else resume();
  }, [discrete.status, start, pause, resume, skipLeadIn]);

  const onFrame = useCallback((listener: FrameListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return { ...discrete, start, pause, resume, toggle, stop, skipLeadIn, close, onFrame };
}
