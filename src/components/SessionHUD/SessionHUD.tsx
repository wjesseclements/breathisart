import type { BreathPattern } from '../../engine/patterns';
import type { BreathSession } from '../Pacer/useBreathSession';
import { pillButton } from '../ui';
import { formatClock, formatRemaining } from './sessionFormat';

interface SessionHUDProps {
  session: BreathSession;
  pattern: BreathPattern;
  /** Total seconds for a timed session, or null when open-ended. */
  limitSeconds: number | null;
  /** Inside the last 20s, so the close can be telegraphed. */
  finishing: boolean;
  /** Just came back from a backgrounded tab — say so rather than sitting frozen. */
  resumedFromAway: boolean;
  visible: boolean;
  onEnd: () => void;
}

/**
 * In-session controls (PLAN_V2 slice 17).
 *
 * Two structural fixes:
 *
 * The two states share one grid cell and hand off in sequence — one fades out
 * over 300ms, then the other fades in. Crossfading them simultaneously left
 * the ambient line sitting semi-transparently over the End pill for the whole
 * transition, which is exactly what it looked like.
 *
 * 1. **It fades TO something, not out of existence.** When the HUD auto-hides
 *    after 4s the slot used to go empty, which is most of why the session
 *    state read as dead space. Now an ambient line takes its place, keeping
 *    the lower anchor alive and moving the cycle count off the control row
 *    where it was competing with the buttons.
 * 2. **`opacity`, never `visibility`.** `invisible` removes descendants from
 *    the tab order and the accessibility tree, so Pause and End used to
 *    disappear entirely for keyboard and screen-reader users. `End` is also
 *    always reachable now — the app warns that 4-7-8 causes lightheadedness,
 *    and the stop button should not be invisible when that happens.
 */
export function SessionHUD({
  session,
  pattern,
  limitSeconds,
  finishing,
  resumedFromAway,
  visible,
  onEnd,
}: SessionHUDProps) {
  // Nothing to offer while the session is ending: Pause/Resume would both be
  // lies, and End has already happened.
  const closing = session.status === 'closing';
  const showControls = visible && !closing;

  return (
    <div className="grid grid-cols-1 grid-rows-1 place-items-center">
      <div
        className={`[grid-area:1/1] flex items-center gap-5 transition-opacity duration-300 ${
          showControls ? 'opacity-100 delay-300' : 'pointer-events-none opacity-0 delay-0'
        }`}
      >
        {/* Remaining, not elapsed, when the session is timed: elapsed is the
            number you stare at when you want it to be over. */}
        <span
          className={`text-meta tabular-nums transition-colors ${finishing ? 'text-ink' : 'text-ink-muted'}`}
        >
          <span className="sr-only">
            {limitSeconds === null ? 'Elapsed time ' : 'Time remaining '}
          </span>
          {limitSeconds === null
            ? formatClock(session.elapsedSeconds)
            : formatRemaining(limitSeconds - session.elapsedSeconds)}
        </span>
        {/* During the settling beat the toggle SKIPS it, so say so. It used to
            fall through to "Resume", which described nothing that was happening. */}
        <button type="button" onClick={session.toggle} className={pillButton}>
          {session.status === 'leading'
            ? 'Skip'
            : session.status === 'running'
              ? 'Pause'
              : 'Resume'}
        </button>
        <button type="button" onClick={onEnd} className={pillButton}>
          End
        </button>
      </div>

      <p
        aria-hidden="true"
        // `pointer-events-none` unconditionally: this line shares a grid cell
        // with the Pause/End row, and an invisible <p> still swallows clicks.
        // Fading it was not enough -- End was unclickable whenever the
        // ambient line was the layer on top.
        className={`pointer-events-none [grid-area:1/1] text-label uppercase tabular-nums text-ink-faint transition-opacity duration-300 ${
          showControls ? 'opacity-0 delay-0' : 'opacity-100 delay-300'
        }`}
      >
        {closing
          ? ''
          : resumedFromAway
            ? 'Paused while you were away'
            : session.status === 'leading'
              ? 'Settling'
              : `${pattern.name} · cycle ${session.cycles + 1}`}
      </p>
    </div>
  );
}
