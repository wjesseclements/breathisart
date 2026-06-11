import { useEffect, useRef } from 'react';
import { playCue } from '../../engine/audio';
import { useSettings } from '../../store/useSettings';
import type { BreathSession } from './useBreathSession';

/**
 * Fires audio tones and haptic pulses on phase transitions (and the first
 * phase of a session). Keyed by cycle+phase so pause/resume never re-cues.
 */
export function usePhaseCues(session: BreathSession): void {
  const audioCues = useSettings((s) => s.audioCues);
  const volume = useSettings((s) => s.volume);
  const haptics = useSettings((s) => s.haptics);
  const prevKeyRef = useRef<string | null>(null);

  const { status, phaseIndex, cycles, phase } = session;
  useEffect(() => {
    if (status !== 'running') {
      prevKeyRef.current = null;
      return;
    }
    const key = `${cycles}:${phaseIndex}`;
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;
    if (audioCues) playCue(phase.kind, volume);
    if (haptics && 'vibrate' in navigator) navigator.vibrate(20);
  }, [status, phaseIndex, cycles, phase, audioCues, volume, haptics]);
}
