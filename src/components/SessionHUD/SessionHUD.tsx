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
  visible: boolean;
  onEnd: () => void;
}

/**
 * In-session controls (PLAN_V2 slice 17).
 *
 * Two structural fixes:
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
  visible,
  onEnd,
}: SessionHUDProps) {
  return (
    <div className="grid grid-cols-1 grid-rows-1 place-items-center">
      <div
        className={`[grid-area:1/1] flex items-center gap-5 transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'pointer-events-none opacity-0'
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
        className={`[grid-area:1/1] text-label uppercase tabular-nums text-ink-faint transition-opacity duration-500 ${
          visible ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {session.status === 'leading'
          ? 'Settling'
          : `${pattern.name} · cycle ${session.cycles + 1}`}
      </p>
    </div>
  );
}
