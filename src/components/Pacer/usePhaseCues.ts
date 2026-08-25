import { useEffect, useRef } from 'react';
import { playCue } from '../../engine/audio';
import { useSettings } from '../../store/useSettings';
import type { BreathSession } from './useBreathSession';

/**
 * Fires audio tones and haptic pulses on phase transitions (and the first
 * phase of a session). The cycle+phase dedup key persists across pauses so
 * resuming mid-phase never re-cues; it resets only when the session ends,
 * so the next session cues its first phase again.
 */
export function usePhaseCues(session: BreathSession): void {
  const audioCues = useSettings((s) => s.audioCues);
  const volume = useSettings((s) => s.volume);
  const haptics = useSettings((s) => s.haptics);
  const prevKeyRef = useRef<string | null>(null);

  const { status, phaseIndex, cycles, phase } = session;
  useEffect(() => {
    if (status === 'idle') {
      prevKeyRef.current = null;
      return;
    }
    if (status !== 'running') return;
    const key = `${cycles}:${phaseIndex}`;
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;
    if (audioCues) playCue(phase.kind, volume);
    if (haptics && 'vibrate' in navigator) navigator.vibrate(20);
  }, [status, phaseIndex, cycles, phase, audioCues, volume, haptics]);
}
