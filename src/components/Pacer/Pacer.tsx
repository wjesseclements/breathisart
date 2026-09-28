import { useEffect, useRef, useState } from 'react';
import type { BreathPattern } from '../../engine/patterns';
import { focusRingOffset8 } from '../ui';
import { phaseWord } from './pacerMath';
import { OrbLayers } from './OrbLayers';
import { DEFAULT_ACCENT, PATTERN_ACCENTS, accentVars } from './pacerTheme';
import { PhaseWord } from './PhaseWord';
import { ProgressRing } from './ProgressRing';
import { useOrbPainter } from './useOrbPainter';
import type { BreathSession } from './useBreathSession';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** People need ~300ms to act on a cue, so the word leads the boundary. */
const WORD_LEAD_S = 0.35;

interface PacerProps {
  pattern: BreathPattern;
  session: BreathSession;
}

/**
 * The pacer: an orb lit from inside, in a room that answers it.
 *
 * This component owns lifecycle only — subscribing to the engine's frames,
 * keeping the phase word slightly ahead of the boundary, and the space-bar
 * shortcut. All per-frame painting lives in `useOrbPainter`, and the layer
 * stack lives in `OrbLayers`.
 */
export function Pacer({ pattern, session }: PacerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const accent = PATTERN_ACCENTS[pattern.id] ?? DEFAULT_ACCENT;

  const orb = useRef<HTMLDivElement>(null);
  const innerLight = useRef<HTMLDivElement>(null);
  const bounce = useRef<HTMLDivElement>(null);
  const depth = useRef<HTMLDivElement>(null);
  const causticA = useRef<HTMLDivElement>(null);
  const causticB = useRef<HTMLDivElement>(null);
  const waterline = useRef<HTMLDivElement>(null);
  const rim = useRef<HTMLDivElement>(null);
  const fieldNear = useRef<HTMLDivElement>(null);
  const fieldFar = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);

  const { phases } = pattern;
  const { drawFrame, lastFrameRef, resetClock } = useOrbPainter(phases, reducedMotion, {
    orb,
    innerLight,
    bounce,
    depth,
    causticA,
    causticB,
    waterline,
    rim,
    fieldNear,
    fieldFar,
    ground,
    ring,
  });

  // The displayed word runs slightly ahead of the engine: its crossfade starts
  // WORD_LEAD_S before each boundary so the incoming word lands with the new
  // phase instead of trailing it.
  const [wordIndex, setWordIndex] = useState(session.phaseIndex);
  const { onFrame, status } = session;
  // While frames aren't flowing (idle/paused/pattern change), track the
  // engine's phase directly (render-phase adjustment, as in PhaseWord).
  if (status !== 'running' && wordIndex !== session.phaseIndex) {
    setWordIndex(session.phaseIndex);
  }

  useEffect(() => {
    if (status === 'idle') drawFrame(0, 0, 0, 0);
    else drawFrame(lastFrameRef.current.phaseIndex, lastFrameRef.current.t, 0, 0);
    return onFrame((snap) => {
      drawFrame(snap.phaseIndex, snap.t, snap.elapsed, snap.cycles);
      const secondsLeft = phases[snap.phaseIndex].seconds * (1 - snap.t);
      setWordIndex(
        secondsLeft <= WORD_LEAD_S ? (snap.phaseIndex + 1) % phases.length : snap.phaseIndex,
      );
    });
  }, [onFrame, status, drawFrame, phases, lastFrameRef]);

  // Resuming should glide from where the scene actually is, not snap to it.
  useEffect(() => {
    if (status !== 'running') resetClock();
  }, [status, resetClock]);

  // Space = start/pause. Skip when an interactive element has focus —
  // a focused button already handles space natively.
  const { toggle } = session;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea, [role="button"], [role="dialog"]'))
        return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const idle = status === 'idle';
  const orbLabel = idle
    ? 'Begin breathing session'
    : `${status === 'running' ? 'Pause' : 'Resume'} breathing session`;
  const announcement =
    status === 'running' ? phaseWord(session.phase) : status === 'paused' ? 'Paused' : '';

  return (
    <div className="flex flex-col items-center gap-10">
      <button
        type="button"
        onClick={session.toggle}
        aria-label={orbLabel}
        data-status={status}
        style={accentVars(accent)}
        className={`relative h-[min(17rem,44svh)] w-[min(17rem,44svh)] rounded-full ${focusRingOffset8}`}
      >
        {/* Idle ambient float wraps everything; CSS-animated, idle only, and
            deliberately not phase-locked — it is decoration, never the clock. */}
        <div
          className={`absolute inset-0 ${idle && !reducedMotion ? 'animate-ambient motion-reduce:animate-none' : ''}`}
        >
          <OrbLayers
            reducedMotion={reducedMotion}
            orb={orb}
            innerLight={innerLight}
            bounce={bounce}
            depth={depth}
            causticA={causticA}
            causticB={causticB}
            waterline={waterline}
            rim={rim}
            fieldNear={fieldNear}
            fieldFar={fieldFar}
            ground={ground}
          />
        </div>
        <ProgressRing circleRef={ring} visible={!idle} />
      </button>

      <PhaseWord text={idle ? pattern.name : phaseWord(phases[wordIndex] ?? session.phase)} />

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
