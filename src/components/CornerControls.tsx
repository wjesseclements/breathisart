import { ensureAudio, playCue } from '../engine/audio';
import { useSettings } from '../store/useSettings';
import { focusRing } from './ui';

/**
 * The three fixed-corner controls, together because their rules only make
 * sense against each other.
 *
 * Left corner means stop: `End`, session only.
 * Right corner means adjust: phase tones always, settings when idle.
 *
 * The asymmetry on the right is deliberate. Silencing the tones is a one-tap
 * toggle you might want mid-breath; opening the drawer over a running session
 * is an interruption. So one stays and one steps aside.
 *
 * Extracted from `Home` when the sound toggle landed — that file was already
 * 479 lines against a ~150-line convention, and this is the one cluster in it
 * that is genuinely self-contained.
 */

/** 44px, the minimum comfortable touch target, and the shape the `···` set. */
const cornerButton = `grid h-11 w-11 place-items-center rounded-full text-ink-faint transition-opacity duration-500 ${focusRing}`;

/* TODO(slice 20): light/dark pair has no exact token — slate-800 / slate-300
   (the hover pair straddles two token levels: ink-strong and ink) */
const cornerHover = 'hover:text-slate-800 dark:hover:text-slate-300';

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" />
      {on ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M15.2 9.2a4 4 0 0 1 0 5.6" />
          <path d="M17.8 6.8a7.5 7.5 0 0 1 0 10.4" />
        </g>
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M15.5 10l4.5 4" />
          <path d="M20 10l-4.5 4" />
        </g>
      )}
    </svg>
  );
}

export function CornerControls({
  idle,
  inSession,
  onOpenSettings,
  onEnd,
}: {
  idle: boolean;
  /** leading / running / paused — not `closing`, where End has already happened. */
  inSession: boolean;
  onOpenSettings: () => void;
  onEnd: () => void;
}) {
  const audioCues = useSettings((s) => s.audioCues);
  const setAudioCues = useSettings((s) => s.setAudioCues);
  const volume = useSettings((s) => s.volume);

  /**
   * `ensureAudio` always, because iOS only lets an AudioContext start inside a
   * user gesture and this tap is the only gesture we are guaranteed — without
   * it the first real cue of the session can be the one that silently fails.
   *
   * The confirmation cue only when nothing is running. Idle, it tells you what
   * you just switched on. Mid-session it would be a stray tone out of rhythm
   * with the breath, and the next phase cue arrives within seconds anyway and
   * confirms it better than a beep could.
   */
  const toggleTones = () => {
    const next = !audioCues;
    setAudioCues(next);
    if (!next) return;
    ensureAudio();
    if (!inSession) playCue('inhale', volume);
  };

  return (
    <>
      <div className="fixed right-[max(1.25rem,env(safe-area-inset-right))] top-[calc(1.25rem+env(safe-area-inset-top))] z-30 flex items-center gap-1">
        {/* On the idle screen rather than two levels deep in Settings, where
            nobody found it (PLAN_V2 slice 23). The default stays off — a
            stress tool gets opened in open-plan offices — so the fix to
            discoverability is placement, not the default.

            Visible in EVERY state, unlike its neighbour. It first shipped
            idle-only, mirroring the `···`, which was wrong: mid-session is
            precisely when you want to silence it — someone walks in, or the
            tones turn out to be more intrusive than they sounded. Idle-only
            meant ending the session to change your mind. The settings button
            keeps hiding, because a drawer over a running breath is a genuine
            interruption and a one-tap toggle is not.

            Its neighbour keeps its 44px box while faded, so this one does not
            slide sideways when a session starts. */}
        <button
          type="button"
          onClick={toggleTones}
          aria-label="Phase tones"
          aria-pressed={audioCues}
          className={`${cornerButton} ${cornerHover} opacity-100`}
        >
          <SpeakerIcon on={audioCues} />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          aria-hidden={!idle}
          tabIndex={idle ? undefined : -1}
          className={`${cornerButton} ${cornerHover} ${idle ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>

      {/*
        Persistent End (PLAN_V2 slice 18).

        The plan specified 28% opacity. That is not shippable: measured against
        the scene behind it, --ink-faint at 28% is 1.67:1 in dark and 1.50:1 in
        light, under even the 3:1 floor for a non-text control, and it takes
        78-87% before a 13px label clears 4.5:1. At that point the alpha is
        doing nothing. So the quietness comes from the token instead —
        --ink-faint is the palette's quietest legible tier, and at full opacity
        it measures 6.18:1 dark and 5.20:1 light on screen. Dim enough to
        ignore, which was the point; visible enough to find, which the opacity
        number would have cost.

        `aria-hidden` because End already exists in the HUD, stays in the
        accessibility tree even while the HUD is visually faded, and is
        reachable by keyboard throughout. A second "End, button" would only
        double-announce. This is a redundant pointer affordance, so it is
        pointer-only by design.
      */}
      <button
        type="button"
        onClick={onEnd}
        aria-hidden="true"
        tabIndex={-1}
        className={`fixed left-[max(1.25rem,env(safe-area-inset-left))] top-[calc(1.25rem+env(safe-area-inset-top))] z-30 grid h-11 place-items-center rounded-full px-3 text-meta tracking-wide text-ink-faint transition-opacity duration-500 hover:text-ink ${
          inSession ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        End
      </button>
    </>
  );
}
