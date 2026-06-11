import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Background } from '../components/Background';
import { Pacer } from '../components/Pacer/Pacer';
import { useBreathSession } from '../components/Pacer/useBreathSession';
import { useWakeLock } from '../components/Pacer/useWakeLock';
import { FirstTimeTip } from '../components/PatternPicker/FirstTimeTip';
import { PatternPicker } from '../components/PatternPicker/PatternPicker';
import { SessionHUD } from '../components/SessionHUD/SessionHUD';
import { SessionSummary } from '../components/SessionHUD/SessionSummary';
import { formatSummary } from '../components/SessionHUD/sessionFormat';
import { CustomPatternsSection } from '../components/SettingsDrawer/CustomPatternsSection';
import { PatternBuilder } from '../components/SettingsDrawer/PatternBuilder';
import { SettingsDrawer } from '../components/SettingsDrawer/SettingsDrawer';
import { pillButton } from '../components/ui';
import type { BreathPattern } from '../engine/patterns';
import { BUILT_IN_PATTERNS, resolvePattern } from '../engine/patterns';
import { useSettings } from '../store/useSettings';

const HUD_HIDE_DELAY_MS = 4000;

type DrawerView = null | { kind: 'menu' } | { kind: 'builder'; pattern: BreathPattern | null };

export default function Home() {
  const selectedId = useSettings((s) => s.selectedPatternId);
  const customPatterns = useSettings((s) => s.customPatterns);
  const pattern = resolvePattern(selectedId, customPatterns) ?? BUILT_IN_PATTERNS[0];
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
      <Background />

      <button
        type="button"
        onClick={() => setDrawer({ kind: 'menu' })}
        aria-label="Open settings"
        className={`fixed right-5 top-5 z-30 rounded-full px-3 py-1 text-xl tracking-widest text-slate-600 transition-[opacity,visibility,color] duration-500 hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-breath-teal ${
          idle ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        ···
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
        className={`flex flex-col items-center gap-6 transition-[opacity,visibility] duration-500 ${
          idle ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <PatternPicker
          enabled={idle && !drawerOpen}
          onOpenBuilder={(p) => setDrawer({ kind: 'builder', pattern: p })}
        />
        <FirstTimeTip />
        <Link
          to="/research"
          className="text-sm text-slate-500 underline-offset-4 transition-colors hover:text-breath-teal hover:underline"
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
          <CustomPatternsSection
            onNew={() => setDrawer({ kind: 'builder', pattern: null })}
            onEdit={(p) => setDrawer({ kind: 'builder', pattern: p })}
          />
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
