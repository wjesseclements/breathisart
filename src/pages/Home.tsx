import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Background } from '../components/Background';
import { OnboardingHint } from '../components/OnboardingHint';
import { Pacer } from '../components/Pacer/Pacer';
import { useBreathSession } from '../components/Pacer/useBreathSession';
import { usePhaseCues } from '../components/Pacer/usePhaseCues';
import { useWakeLock } from '../components/Pacer/useWakeLock';
import { FirstTimeTip } from '../components/PatternPicker/FirstTimeTip';
import { PatternPicker } from '../components/PatternPicker/PatternPicker';
import { SessionHUD } from '../components/SessionHUD/SessionHUD';
import { SessionSummary } from '../components/SessionHUD/SessionSummary';
import { formatSummary } from '../components/SessionHUD/sessionFormat';
import { CustomPatternsSection } from '../components/SettingsDrawer/CustomPatternsSection';
import { PatternBuilder } from '../components/SettingsDrawer/PatternBuilder';
import { PreferencesSection } from '../components/SettingsDrawer/PreferencesSection';
import { SettingsDrawer } from '../components/SettingsDrawer/SettingsDrawer';
import { SharedPatternBanner } from '../components/SharedPatternBanner';
import { pillButton } from '../components/ui';
import { playCue } from '../engine/audio';
import type { BreathPattern } from '../engine/patterns';
import { BUILT_IN_PATTERNS, describePhases, resolvePattern } from '../engine/patterns';
import { decodePhases } from '../engine/shareUrl';
import { usePageTitle } from '../components/usePageTitle';
import { useSettings } from '../store/useSettings';

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
      name: sharedName?.trim() || 'Shared pattern',
      tagline: describePhases(phases),
      phases,
      builtIn: false,
    };
  }, [sharedParam, sharedName]);
  const sharedInvalid = sharedParam !== null && sharedPattern === null;

  const clearShared = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);
  const saveShared = useCallback(() => {
    if (!sharedPattern) return;
    const saved = { ...sharedPattern, id: `custom-${crypto.randomUUID()}` };
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
  const session = useBreathSession(pattern);
  const { status, elapsedSeconds, cycles, start, pause, stop } = session;
  const idle = status === 'idle';

  const [drawer, setDrawer] = useState<DrawerView>(null);

  // A new session clears any lingering summary (render-phase adjustment).
  const [summary, setSummary] = useState<string | null>(null);
  const [prevStatus, setPrevStatus] = useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    if (status === 'running') setSummary(null);
  }

  useWakeLock(status === 'running');
  usePhaseCues(session);
  usePageTitle('Stillpoint — a breath pacer');

  // Starting the first session is the onboarding's natural end.
  const dismissOnboarding = useSettings((s) => s.dismissOnboarding);
  useEffect(() => {
    if (status === 'running') dismissOnboarding();
  }, [status, dismissOnboarding]);

  // v1 behavior (PRD §3): backgrounding the tab auto-pauses the session.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pause]);

  const endSession = useCallback(() => {
    setSummary(formatSummary(elapsedSeconds, cycles));
    stop();
  }, [elapsedSeconds, cycles, stop]);

  // Timed sessions (PRD §5): soft chime, then end with the summary.
  // Checked in the frame pipeline so it fires the moment the limit is crossed.
  const sessionLengthMin = useSettings((s) => s.sessionLengthMin);
  const volume = useSettings((s) => s.volume);
  const { onFrame } = session;
  useEffect(() => {
    if (sessionLengthMin === null) return;
    const limitSeconds = sessionLengthMin * 60;
    return onFrame((snap) => {
      if (snap.status === 'running' && snap.elapsed >= limitSeconds) {
        playCue('chime', volume);
        endSession();
      }
    });
  }, [onFrame, sessionLengthMin, volume, endSession]);

  // Esc: close the drawer first; otherwise end the session / dismiss summary.
  const drawerOpen = drawer !== null;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (drawerOpen) setDrawer(null);
      else if (!idle) endSession();
      else setSummary(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, idle, endSession]);

  // While running, the HUD fades out after a few seconds; tapping
  // anywhere brings it back. Pausing always shows it.
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
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', reveal);
    };
  }, [status]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-10">
      <h1 className="sr-only">Stillpoint — a breath pacer</h1>
      <Background />

      <button
        type="button"
        onClick={() => setDrawer({ kind: 'menu' })}
        aria-label="Open settings"
        className={`fixed right-5 top-5 z-30 rounded-full px-3 py-1 text-xl tracking-widest text-slate-500 transition-[opacity,visibility,color] duration-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal ${
          idle ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      <Pacer pattern={pattern} session={session} />

      <div className="flex h-14 items-center justify-center">
        {summary !== null && idle ? (
          <SessionSummary
            text={summary}
            onAgain={() => {
              setSummary(null);
              start();
            }}
            onDone={() => setSummary(null)}
          />
        ) : idle ? (
          <button type="button" onClick={start} className={pillButton}>
            Begin
          </button>
        ) : (
          <SessionHUD
            session={session}
            visible={status === 'paused' || !hud.hidden}
            onEnd={endSession}
          />
        )}
      </div>

      <div
        className={`flex w-full flex-col items-center gap-6 transition-[opacity,visibility] duration-500 ${
          idle ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
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
        <FirstTimeTip />
        <Link
          to="/research"
          className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal text-sm text-slate-600 underline-offset-4 transition-colors hover:text-teal-700 dark:text-slate-400 dark:hover:text-breath-teal hover:underline"
        >
          The science of slow breathing
        </Link>
      </div>

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
    </main>
  );
}
