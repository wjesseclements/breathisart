import type { BreathPattern } from '../../engine/patterns';
import type { BreathSession } from '../Pacer/useBreathSession';
import { pillButton } from '../ui';
import { formatClock, formatRemaining } from './sessionFormat';

/**
 * The full sentence, because it gets its own line rather than a slot beside
 * two buttons. Measured: beside Resume and End at 318px the clock's slot is
 * 56px wide, which wraps even "Paused while away" to three lines.
 */
export const AWAY_NOTE = 'Paused while you were away';

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
      {/* The note takes a line of its own and the controls drop beneath it,
          all inside the slot's existing 3.625rem: 13px note + 4px + 37px
          buttons = 54px. So nothing on the screen moves -- the row simply
          becomes a column for four and a half seconds. Putting the note
          *beside* the buttons was the first attempt and does not survive a
          narrow phone. */}
      <div
        className={`[grid-area:1/1] flex transition-opacity duration-300 ${
          resumedFromAway ? 'flex-col items-center gap-1' : 'items-center gap-5'
        } ${showControls ? 'opacity-100 delay-300' : 'pointer-events-none opacity-0 delay-0'}`}
      >
        {/* On return from a backgrounded tab the note borrows this slot for a
            few seconds. The clock is the least useful thing on screen at that
            moment -- the orb is frozen and the question is why, not how long
            is left -- and borrowing costs no layout, which a second line
            would. It lived in the ambient line below until it turned out that
            line is hidden whenever the session is paused, i.e. in exactly the
            state the note describes: written, correct, never once seen.

            `role="status"` here and not on the clock: the clock re-renders
            every second and would announce every tick. */}
        {resumedFromAway ? (
          <span role="status" className="text-meta leading-none text-ink">
            {AWAY_NOTE}
          </span>
        ) : (
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
        )}
        {/* Grouped so the column keeps them side by side. In the normal row
            this nests one gap-5 flex inside another, which lays out exactly as
            the three loose children did. */}
        <div className="flex items-center gap-5">
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
          : session.status === 'leading'
            ? 'Settling'
            : `${pattern.name} · cycle ${session.cycles + 1}`}
      </p>
    </div>
  );
}
