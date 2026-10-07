import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Background } from '../components/Background';
import { CornerControls } from '../components/CornerControls';
import { OnboardingHint } from '../components/OnboardingHint';
import { Pacer } from '../components/Pacer/Pacer';
import { useBreathSession } from '../components/Pacer/useBreathSession';
import { usePhaseCues } from '../components/Pacer/usePhaseCues';
import { useWakeLock } from '../components/Pacer/useWakeLock';
import { PatternPicker } from '../components/PatternPicker/PatternPicker';
import { SessionHUD } from '../components/SessionHUD/SessionHUD';
import { SessionProgress } from '../components/SessionHUD/SessionProgress';
import { SessionSummary } from '../components/SessionHUD/SessionSummary';
import { formatSummary } from '../components/SessionHUD/sessionFormat';
import { usePrefersReducedMotion } from '../components/Pacer/usePrefersReducedMotion';
import { useKeyboardHint } from '../components/Pacer/useKeyboardHint';
import { CustomPatternsSection } from '../components/SettingsDrawer/CustomPatternsSection';
import { PatternBuilder } from '../components/SettingsDrawer/PatternBuilder';
import { PreferencesSection } from '../components/SettingsDrawer/PreferencesSection';
import { SettingsDrawer } from '../components/SettingsDrawer/SettingsDrawer';
import { SharedPatternBanner } from '../components/SharedPatternBanner';
import { focusRingOffset4, primaryButton } from '../components/ui';
import { playCue } from '../engine/audio';
import type { BreathPattern } from '../engine/patterns';
import {
  BUILT_IN_PATTERNS,
  clampPatternName,
  describePhases,
  newPatternId,
  resolvePattern,
} from '../engine/patterns';
import { decodePhases } from '../engine/shareUrl';
import { usePageTitle } from '../components/usePageTitle';
import { useSettings } from '../store/useSettings';
import { setSessionActive } from '../pwaUpdate';

const HUD_HIDE_DELAY_MS = 4000;

type DrawerView = null | { kind: 'menu' } | { kind: 'builder'; pattern: BreathPattern | null };

export default function Home() {
  const selectedId = useSettings((s) => s.selectedPatternId);
  const customPatterns = useSettings((s) => s.customPatterns);
  const saveCustomPattern = useSettings((s) => s.saveCustomPattern);
  const selectPattern = useSettings((s) => s.selectPattern);

  // Shared pattern URLs (PRD §7): ?p=in4-h7-out8&n=Name. A valid shared
  // pattern takes over the pacer until saved or dismissed.
  const [searchParams, setSearchParams] = useSearchParams();
  const sharedParam = searchParams.get('p');
  const sharedName = searchParams.get('n');
  const sharedPattern = useMemo<BreathPattern | null>(() => {
    if (sharedParam === null) return null;
    const phases = decodePhases(sharedParam);
    if (!phases) return null;
    return {
      id: '__shared__',
      // Clamped: a link can carry any name, and nothing else bounds it.
      name: clampPatternName(sharedName ?? '') || 'Shared pattern',
      tagline: describePhases(phases),
      phases,
      builtIn: false,
    };
  }, [sharedParam, sharedName]);
  const sharedInvalid = sharedParam !== null && sharedPattern === null;

  const clearShared = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);
  const saveShared = useCallback(() => {
    if (!sharedPattern) return;
    const saved = { ...sharedPattern, id: newPatternId() };
    saveCustomPattern(saved);
    selectPattern(saved.id);
    clearShared();
  }, [sharedPattern, saveCustomPattern, selectPattern, clearShared]);

  // Picking a different pattern while a shared one is active dismisses it.
  const prevSelectedRef = useRef(selectedId);
  useEffect(() => {
    if (prevSelectedRef.current === selectedId) return;
    prevSelectedRef.current = selectedId;
    if (sharedParam !== null) clearShared();
  }, [selectedId, sharedParam, clearShared]);

  const pattern =
    sharedPattern ?? resolvePattern(selectedId, customPatterns) ?? BUILT_IN_PATTERNS[0];
  const leadInSeconds = useSettings((st) => st.leadInSeconds);
  const session = useBreathSession(pattern, leadInSeconds);
  const { status, elapsedSeconds, start, pause, stop } = session;
  const idle = status === 'idle';
  // Not during `closing`: End has already happened, and offering it again
  // would be a second press with nothing to act on.
  const cornerEndVisible = status === 'leading' || status === 'running' || status === 'paused';

  // The room's cast-light layer. `Home` owns it because it is the only common
  // ancestor of the pacer (which paints it, from its own frame loop) and the
  // background (which renders it). Slightly impure, and worth it: it is what
  // makes the scene respond to the orb rather than sit behind it.
  const roomLightRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const showKeyHint = useKeyboardHint();

  const [drawer, setDrawer] = useState<DrawerView>(null);

  // A new session clears any lingering summary (render-phase adjustment).
  const [summary, setSummary] = useState<{ time: string; cycles: number } | null>(null);
  /** Backgrounded-tab bookkeeping; see the visibility effect below. */
  const AWAY_LIMIT_MS = 2 * 60 * 1000;
  const awayAtRef = useRef<number | null>(null);
  const [resumedFromAway, setResumedFromAway] = useState(false);
  const [pendingSummary, setPendingSummary] = useState<{ time: string; cycles: number } | null>(
    null,
  );
  const [prevStatus, setPrevStatus] = useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    if (status === 'running') setSummary(null);
    // The close ends by returning the engine to idle; that is the moment the
    // summary is allowed to appear, ~2.2s after End was pressed.
    if (status === 'idle' && pendingSummary) {
      setSummary(pendingSummary);
      setPendingSummary(null);
    }
    // The away note is an acknowledgement, not a state.
    if (status === 'running' || status === 'idle') setResumedFromAway(false);
  }

  /**
   * The note explains the freeze; once it has, the clock is more useful again.
   * A plain UI timeout, not breath timing -- the one-clock rule governs phase
   * sequencing, and nothing here touches the engine. Pressing Resume clears it
   * sooner, via the status change above.
   */
  useEffect(() => {
    if (!resumedFromAway) return;
    const id = window.setTimeout(() => setResumedFromAway(false), 4500);
    return () => window.clearTimeout(id);
  }, [resumedFromAway]);

  // A pending app update reloads only once nothing is running, so a new
  // release never interrupts a breath.
  useEffect(() => {
    setSessionActive(status !== 'idle');
  }, [status]);

  useWakeLock(status === 'running');
  usePhaseCues(session);
  usePageTitle('Lamptide — a quiet light to breathe by');

  // Starting the first session is the onboarding's natural end.
  const dismissOnboarding = useSettings((s) => s.dismissOnboarding);
  useEffect(() => {
    if (status === 'running') dismissOnboarding();
  }, [status, dismissOnboarding]);

  const { close, cycles } = session;
  /**
   * End through the closing sequence rather than cutting. The summary is
   * captured now but only shown once the engine reaches idle ~2.2s later, so
   * the orb eases out and a human line lands before any numbers do.
   */
  const endSession = useCallback(() => {
    setPendingSummary({ time: formatSummary(elapsedSeconds), cycles });
    close();
  }, [elapsedSeconds, cycles, close]);

  /** Bypass the close entirely — used when returning from a long absence. */
  const endImmediately = useCallback(
    (seconds: number, cycleCount: number) => {
      setSummary({ time: formatSummary(seconds), cycles: cycleCount });
      setPendingSummary(null);
      stop();
    },
    [stop],
  );

  // Timed sessions (PRD §5): soft chime, then end with the summary.
  // Checked in the frame pipeline so it fires the moment the limit is
  // crossed; the summary uses the snapshot's elapsed/cycles, not the
  // once-per-second elapsedSeconds state, which lags the true time.
  /**
   * Backgrounding auto-pauses (PRD §3) — but returning to a frozen orb with no
   * explanation reads as a crash. Coming back inside a couple of minutes shows
   * a quiet line saying what happened; after that the session is over in any
   * meaningful sense, so it closes itself rather than pretending to wait.
   */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // The closing sequence is driven by rAF, and rAF does not run while
        // the page is hidden -- so backgrounding mid-close would strand the
        // session in `closing` forever, with Escape the only way out. There is
        // nothing to animate for someone who is not looking: finish it now.
        if (status === 'closing') {
          stop();
          return;
        }
        if (status === 'running' || status === 'leading') {
          awayAtRef.current = Date.now();
          pause();
        }
        return;
      }
      const awayFor = awayAtRef.current === null ? 0 : Date.now() - awayAtRef.current;
      awayAtRef.current = null;
      if (awayFor === 0) return;
      if (awayFor > AWAY_LIMIT_MS) endImmediately(session.elapsedSeconds, session.cycles);
      else setResumedFromAway(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pause, stop, status, endImmediately, session.elapsedSeconds, session.cycles, AWAY_LIMIT_MS]);

  const sessionLengthMin = useSettings((s) => s.sessionLengthMin);
  const volume = useSettings((s) => s.volume);
  /** True inside the last 20s of a timed session. */
  const [finishing, setFinishing] = useState(false);
  const { onFrame } = session;
  useEffect(() => {
    if (sessionLengthMin === null) return;
    const limitSeconds = sessionLengthMin * 60;
    return onFrame((snap) => {
      if (snap.status !== 'running') return;
      // Telegraph the ending: once inside the last 20s, mark it so the close
      // is expected rather than abrupt.
      setFinishing(snap.elapsed >= limitSeconds - 20);
      if (snap.elapsed < limitSeconds) return;
      // Close on an OUT-breath. Crossing the limit mid-inhale used to cut the
      // session off in the middle of a breath; now it runs to the end of the
      // current exhale (or the end of the cycle if the pattern has no exhale).
      const kind = snap.phase.kind;
      const atCycleEnd = snap.phaseIndex === pattern.phases.length - 1;
      if (!(kind === 'exhale' || atCycleEnd) || snap.t < 0.985) return;
      playCue('chime', volume);
      setPendingSummary({ time: formatSummary(snap.elapsed), cycles: snap.cycles });
      setFinishing(false);
      close();
    });
  }, [onFrame, sessionLengthMin, volume, close, pattern.phases.length]);

  // Esc: close the drawer first; otherwise end the session / dismiss summary.
  const drawerOpen = drawer !== null;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (drawerOpen) setDrawer(null);
      else if (status === 'closing')
        stop(); // second press skips the close
      else if (!idle) endSession();
      else setSummary(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, idle, status, endSession, stop]);

  // While running, the HUD fades out after a few seconds; tapping anywhere
  // or pressing any key brings it back. Pausing always shows it.
  const [hud, setHud] = useState({ status, hidden: false });
  if (hud.status !== status) setHud({ status, hidden: false });
  useEffect(() => {
    if (status !== 'running') return;
    const hide = () => setHud((h) => ({ ...h, hidden: true }));
    let timer = window.setTimeout(hide, HUD_HIDE_DELAY_MS);
    const reveal = () => {
      setHud((h) => (h.hidden ? { ...h, hidden: false } : h));
      window.clearTimeout(timer);
      timer = window.setTimeout(hide, HUD_HIDE_DELAY_MS);
    };
    window.addEventListener('pointerdown', reveal);
    window.addEventListener('keydown', reveal);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', reveal);
      window.removeEventListener('keydown', reveal);
    };
  }, [status]);

  return (
    /*
     * Two rows: the hero centres in whatever space is left above the
     * furniture, and the furniture sits in normal flow beneath it.
     *
     * The furniture used to be `absolute bottom-0` so that hiding it cost no
     * layout. That worked, and it also meant the two could occupy the same
     * space on a short viewport -- the footer painted over the Begin button
     * and, being later in the DOM with pointer events live, swallowed its
     * clicks. Begin was not covered-looking; it was genuinely dead.
     *
     * In-flow with `opacity-0` gets the same zero-shift behaviour without the
     * overlap: an element at zero opacity still occupies its box, so row 2's
     * height never changes and the hero never moves when a session starts.
     * (The original bug was `invisible` inside a single centred flex column,
     * which pushed the orb above true centre AND stripped the controls from
     * the tab order. Neither applies here.)
     *
     * `grid-cols-[minmax(0,1fr)]` keeps an auto track from sizing to
     * max-content and growing past the viewport.
     *
     * LANDSCAPE (`land:`, a phone on its side or a very short window). The
     * stack above cannot work there: the orb was sized off height alone, so on
     * an 844x390 phone it was a 125px dot in an empty field, the page scrolled
     * by 117-181px, and with the hero pinned to the top the progress ring ran
     * 13px off the screen at every landscape size. So the page becomes two
     * columns. The hero and the Pacer go `display: contents`, which makes the
     * orb, the words, the action slot and the furniture cells of this grid:
     *
     *   [ ........ spacer ........ ][      ]
     *   [ words (title / phase)    ][      ]
     *   [ action (Begin / HUD)     ][ orb  ]
     *   [ furniture (picker, link) ][      ]
     *   [ ........ spacer ........ ][      ]
     *
     * The orb is on the RIGHT because the top-right corner holds the speaker
     * and the dots: on the left the text column ran straight into them, and on
     * the right the corner sits over the orb's own margin. Its width comes from
     * its column and its height from `100svh - 6rem`, which leaves the ring
     * 24px of clearance top and bottom by construction rather than by luck.
     *
     * `overflow-hidden` because the orb's halo layers reach past the screen
     * edge, and with only `overflow-x-hidden` this element became a 30px
     * scroll container of its own. `--orb-x` is the orb column's centre, so
     * the room's backlight follows the lamp across.
     */
    <>
      <main className="relative grid min-h-[100svh] grid-cols-[minmax(0,1fr)] grid-rows-[1fr_auto] overflow-x-hidden px-6 land:overflow-hidden land:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] land:grid-rows-[minmax(0.75rem,1fr)_auto_auto_auto_minmax(0.5rem,1fr)] land:pl-[max(1.5rem,env(safe-area-inset-left))] land:pr-[max(1.5rem,env(safe-area-inset-right))] land:[--orb-x:calc(100%_-_1.5rem_-_(100%_-_3rem)_*_2_/_9)]">
        <h1 className="sr-only">Lamptide — a quiet light to breathe by</h1>
        <Background roomLightRef={roomLightRef} />
        <SessionProgress
          session={session}
          limitSeconds={sessionLengthMin === null ? null : sessionLengthMin * 60}
          reducedMotion={reducedMotion}
        />

        <CornerControls
          idle={idle}
          inSession={cornerEndVisible}
          onOpenSettings={() => setDrawer({ kind: 'menu' })}
          onEnd={endSession}
        />

        {/*
        HERO -- centred in row 1.
        Sized so it FITS rather than overflows. On an iPhone the small viewport
        is ~641px; the footer reserves ~162px, leaving ~479px. At the previous
        44svh orb with 36px gaps the hero wanted 560px, so `justify-center`
        split the 81px overflow and pushed the orb up behind Safari's URL bar.
        32svh plus tighter gaps below `sm` brings it to ~453px.
      */}
        <div className="flex w-full min-w-0 flex-col items-center justify-center gap-4 py-4 [justify-content:safe_center] sm:gap-9 sm:py-6 short:gap-3 short:py-2 land:contents">
          <Pacer
            pattern={pattern}
            session={session}
            roomLightRef={roomLightRef}
            showTitle={summary === null}
          />

          {/* A 1x1 grid so the four states crossfade in place rather than
            jump-cutting. `min-h` because only ONE state is mounted at a time:
            without it the slot shrinks from the 58px Begin pill to the 37px
            HUD row, and the centred hero above it slides up ~56px the moment
            a session starts. Tied to the primary button, the tallest state. */}
          <div className="grid min-h-16 grid-cols-1 grid-rows-1 place-items-center land:mt-2 land:[grid-area:3/1]">
            <div className="[grid-area:1/1]">
              {summary !== null && idle ? (
                <SessionSummary
                  patternName={pattern.name}
                  time={summary.time}
                  cycles={summary.cycles}
                  onAgain={() => {
                    setSummary(null);
                    start();
                  }}
                  onDone={() => setSummary(null)}
                />
              ) : idle ? (
                <button type="button" onClick={start} className={primaryButton}>
                  Begin
                </button>
              ) : (
                <SessionHUD
                  resumedFromAway={resumedFromAway}
                  session={session}
                  pattern={pattern}
                  limitSeconds={sessionLengthMin === null ? null : sessionLengthMin * 60}
                  finishing={finishing}
                  visible={status === 'paused' || !hud.hidden}
                  onEnd={endSession}
                />
              )}
            </div>
          </div>
        </div>

        {/*
          FURNITURE -- row 2, in flow.

          It used to hold its full box during a session so the hero above it
          could not shift. Measured on an iPhone at 390x641 that meant 164px
          reserved for something invisible and 209px of dead screen below the
          cycle line, while the orb was squeezed to 19px of clearance from
          Safari's URL bar and its progress ring ran under the corner controls.
          Reserving space for nothing was costing the one thing on screen.

          So it collapses now — but over 500ms, together with the fade, so the
          orb glides down into the middle rather than jumping there. The
          transition is the whole point: a layout that snaps at the moment you
          start breathing is worse than one that settles.

          `max-h-0` with `opacity-0`, not `hidden` or `invisible`. This row is
          `aria-hidden` during a session anyway, so the distinction is about
          the transition rather than semantics — `display: none` cannot be
          animated, and the settle is the point.
        */}
        <div
          aria-hidden={!idle}
          /* Tighter below `sm`. Raising every target to 44px added ~47px to this
           row, and on a 390x641 small viewport the page already overflowed by
           51 before that — the pattern picker sat just below the fold. The
           gaps give it back; the targets keep their size. */
          className={`flex w-full min-w-0 flex-col items-center gap-3 overflow-hidden pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-[opacity,max-height] duration-500 sm:gap-5 sm:pb-[calc(1rem+env(safe-area-inset-bottom))] land:mt-2 land:gap-1.5 land:pb-0 land:[grid-area:4/1] ${
            idle ? 'max-h-[32rem] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
          }`}
        >
          {showKeyHint && (
            <p className="text-label uppercase text-ink-faint">
              Space to start · Esc to end · ← → pattern
            </p>
          )}
          <OnboardingHint />
          {(sharedPattern !== null || sharedInvalid) && (
            <SharedPatternBanner
              pattern={sharedPattern}
              onSave={saveShared}
              onDismiss={clearShared}
            />
          )}
          <PatternPicker
            enabled={idle && !drawerOpen}
            onOpenBuilder={(p) => setDrawer({ kind: 'builder', pattern: p })}
          />
          {/* The link and the caution are one group with no gap between them:
              the link's 44px box already leaves 12px of air under its text,
              and a flex gap on top of that cost height a phone does not have. */}
          <div className="flex flex-col items-center">
            {/* Not `linkText`: the accent treatment made the least important
                element on the screen the brightest thing on it, louder than the
                pattern names and louder than Begin. The underline stays, so
                colour is not the only cue and WCAG 1.4.1 is still satisfied
                without shouting. */}
            <Link
              to="/research"
              className={`inline-flex min-h-11 items-center rounded text-meta text-ink-muted underline decoration-[rgb(var(--ink-faint)/0.5)] underline-offset-4 transition-colors hover:text-ink hover:decoration-[rgb(var(--ink-muted))] ${focusRingOffset4}`}
            >
              The science of slow breathing
            </Link>
            {/* The standing caution (PRD §5). It replaced a tip that appeared
                once, for 4-7-8 only: holds and long exhales can do this in any
                pattern, and a notice dismissed once protected nobody the second
                time. Quiet, one line, never a popup — but `ink-muted`, not
                `ink-faint`: at the foot of the light theme, where the floor of
                the room is darkest, faint measured 4.18:1 against a 4.5 floor,
                and a safety line is the last thing that should fail it. Its ~16px came out of
                the gaps (below `sm`: hero 24->16, orb to words 40->32, bottom
                padding 16->12; above it, bottom padding 32->16): portrait had
                2px to spare on a 390x641 iPhone, so a line could not simply be
                added. */}
            <p className="text-balance text-center text-meta leading-tight text-ink-muted">
              Go gently, and stop if you feel lightheaded.
            </p>
          </div>
        </div>
      </main>

      {/*
       * OUTSIDE <main>, and that is load-bearing. The drawer marks `<main>`
       * `inert` while it is open so the page behind it is unreachable by
       * keyboard. When the drawer was a child of <main> that inert applied to
       * the drawer itself: every control inside it went dead, including Close,
       * with no way out.
       */}
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawer(null)}
        title={
          drawer?.kind === 'builder'
            ? drawer.pattern
              ? 'Edit pattern'
              : 'New pattern'
            : 'Settings'
        }
      >
        {drawer?.kind === 'menu' && (
          <div className="flex flex-col gap-8">
            <PreferencesSection />
            <CustomPatternsSection
              onNew={() => setDrawer({ kind: 'builder', pattern: null })}
              onEdit={(p) => setDrawer({ kind: 'builder', pattern: p })}
            />
          </div>
        )}
        {drawer?.kind === 'builder' && (
          <PatternBuilder
            key={drawer.pattern?.id ?? 'new'}
            initial={drawer.pattern}
            onBack={() => setDrawer({ kind: 'menu' })}
            onDone={() => setDrawer(null)}
          />
        )}
      </SettingsDrawer>
    </>
  );
}
