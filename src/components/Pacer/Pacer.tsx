import { useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../../store/useSettings';
import type { RefObject } from 'react';
import type { BreathPattern } from '../../engine/patterns';
import { focusRingOffset8 } from '../ui';
import { phaseWord } from './pacerMath';
import { OrbLayers } from './OrbLayers';
import { applyAccent } from './pacerTheme';
import { useIsDarkTheme } from './useIsDarkTheme';
import { PatternTitle } from './PatternTitle';
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
  /** The room's cast-light layer, so the scene can answer the orb. */
  roomLightRef?: RefObject<HTMLDivElement>;
  /**
   * False while the post-session summary is up: the summary already names the
   * pattern, so showing the identity block too printed "Box Breathing" twice.
   */
  showTitle?: boolean;
}

/**
 * The pacer: an orb lit from inside, in a room that answers it.
 *
 * This component owns lifecycle only — subscribing to the engine's frames,
 * keeping the phase word slightly ahead of the boundary, and the space-bar
 * shortcut. All per-frame painting lives in `useOrbPainter`, and the layer
 * stack lives in `OrbLayers`.
 */
export function Pacer({ pattern, session, roomLightRef, showTitle = true }: PacerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const isDark = useIsDarkTheme();

  useEffect(() => {
    applyAccent(pattern.id, isDark);
  }, [pattern.id, isDark]);

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
  /**
   * One type size for the whole session, from the longest word this pattern
   * will ever show. Deriving it per-word made the hero resize on every phase
   * transition, because "Hold" and "Breathe in" fall on opposite sides of any
   * length threshold.
   */
  const wordSizeClass = useMemo(() => {
    // Phase words only. The lead-in string ("Breathe in, in 3") is the longest
    // thing shown and would drag every pattern down a step, so it carries its
    // own modest size instead — it is a transient cue, not the hero.
    const longest = Math.max(...phases.map((p) => phaseWord(p).length));
    if (longest > 20) return 'text-lede';
    if (longest > 14) return 'text-title';
    // "Breathe in" / "Breathe out" (10-11 chars) live here. `display` is only
    // safe for a single short word.
    if (longest > 6) return 'text-hero';
    return 'text-display';
  }, [phases]);
  const closing = session.status === 'closing';
  const { drawFrame, lastFrameRef, resetClock } = useOrbPainter(
    phases,
    reducedMotion,
    {
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
      roomLight: roomLightRef,
    },
    closing,
  );

  // The displayed word runs slightly ahead of the engine: its crossfade starts
  // WORD_LEAD_S before each boundary so the incoming word lands with the new
  // phase instead of trailing it.
  const showCountdown = useSettings((st) => st.showCountdown);
  const spokenCues = useSettings((st) => st.spokenCues);
  const [wordIndex, setWordIndex] = useState(session.phaseIndex);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
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
      const left = phases[snap.phaseIndex].seconds * (1 - snap.t);
      setWordIndex(left <= WORD_LEAD_S ? (snap.phaseIndex + 1) % phases.length : snap.phaseIndex);
      // Whole seconds only, so this is a handful of renders per phase rather
      // than one per frame.
      setSecondsLeft(Math.max(1, Math.ceil(left)));
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
  const leading = status === 'leading';
  /**
   * The settling beat. One steady phrase, with the count carried by the
   * numeral beneath it — "Breathe in, in 3" put the preposition twice in a row
   * and read as a stumble. The prep is the point; the sentence was not.
   */
  const leadWord = 'Settle in';
  const orbLabel = idle
    ? 'Begin breathing session'
    : closing
      ? 'Session ending'
      : leading
        ? 'Skip the settling beat and breathe in now'
        : `${status === 'running' ? 'Pause' : 'Resume'} breathing session`;
  // Announce the duration too: without it a non-visual user gets "Hold" and no
  // way to pace, while sighted users get a ring and a numeral.
  const currentPhase = phases[wordIndex] ?? session.phase;
  const announcement = closing
    ? 'Session complete'
    : leading
      ? `Settle in, starting in ${session.leadSeconds}`
      : status === 'running'
        ? `${phaseWord(currentPhase)}, ${currentPhase.seconds} seconds`
        : status === 'paused'
          ? 'Paused'
          : '';

  return (
    // `land:contents`: in landscape the orb and the words become cells of the
    // page grid in Home rather than a stack, so the orb can have a column of
    // its own. See the grid on <main>.
    <div className="flex flex-col items-center gap-8 sm:gap-10 land:contents">
      <button
        type="button"
        onClick={session.toggle}
        disabled={closing}
        aria-label={orbLabel}
        data-status={status}
        className={`relative h-[min(17rem,32svh)] w-[min(17rem,32svh)] rounded-full land:aspect-square land:h-auto land:w-[min(17rem,calc(100svh_-_6rem),calc(100%_-_3rem))] land:place-self-center land:[grid-area:1/2/-1/3] ${focusRingOffset8}`}
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
        <ProgressRing circleRef={ring} visible={!idle && !leading && !closing} />
      </button>

      {/*
        Both states occupy one grid cell, so the cell is always as tall as the
        taller of them -- for every pattern and every width, with no magic
        number. Rendering only one at a time made the hero shrink by ~56px when
        a session started (a four-line identity block replaced by a one-line
        instruction), and the centred layout slid the orb up to match. A jump
        at the exact moment you are being asked to settle.
      */}
      <div
        className={`grid w-full grid-cols-1 grid-rows-1 place-items-center land:[grid-area:2/1] ${
          // In landscape this cell has no orb to hold in place, so while the
          // session summary is up (both states in it invisible) it gives its
          // height back rather than holding ~80px of nothing above the summary.
          idle && !showTitle ? 'land:hidden' : ''
        }`}
      >
        <div
          aria-hidden={!idle || !showTitle}
          className={`[grid-area:1/1] w-full transition-opacity duration-300 ${
            idle && showTitle ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <PatternTitle pattern={pattern} />
        </div>
        <div
          aria-hidden={idle}
          className={`[grid-area:1/1] w-full transition-opacity duration-300 ${
            idle ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <PhaseWord
            sizeClass={leading || closing ? 'text-title' : wordSizeClass}
            text={
              closing ? 'That’s it. Take a moment.' : leading ? leadWord : phaseWord(currentPhase)
            }
            countdown={
              closing ? null : leading ? session.leadSeconds : showCountdown ? secondsLeft : null
            }
            reducedMotion={reducedMotion}
          />
        </div>
      </div>

      {/* The pattern itself was never exposed to assistive tech, so arrow-key
          switching was silent. `aria-live` only while running, so changing
          pattern at idle announces once rather than joining a queue. */}
      <div aria-live="polite" className="sr-only">
        {spokenCues ? announcement : ''}
      </div>
      <div aria-live="polite" className="sr-only">
        {idle ? `${pattern.name}. ${pattern.tagline}` : ''}
      </div>
    </div>
  );
}
