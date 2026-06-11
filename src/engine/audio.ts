import type { PhaseKind } from './patterns';

export type CueKind = PhaseKind | 'chime';

// Lazily created on first cue; by then a user gesture (Begin) has occurred,
// which keeps autoplay policies happy.
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx = new AudioContext();
  return ctx;
}

interface ToneOpts {
  from: number;
  to: number;
  start: number;
  duration: number;
  peak: number;
}

function tone(ac: AudioContext, { from, to, start, duration, peak }: ToneOpts): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, start);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/**
 * Synthesized cues (PRD §5): rising tone on inhale, falling on exhale,
 * soft tick on hold, two-note chime for timed-session completion.
 * No audio files. volume ∈ [0,1]; 0 is silent.
 */
export function playCue(kind: CueKind, volume: number): void {
  if (volume <= 0) return;
  const ac = getContext();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const now = ac.currentTime;
  const peak = 0.25 * Math.min(1, volume);
  switch (kind) {
    case 'inhale':
      tone(ac, { from: 240, to: 420, start: now, duration: 0.5, peak });
      break;
    case 'exhale':
      tone(ac, { from: 420, to: 220, start: now, duration: 0.7, peak });
      break;
    case 'hold':
      tone(ac, { from: 320, to: 320, start: now, duration: 0.12, peak: peak * 0.7 });
      break;
    case 'chime':
      tone(ac, { from: 523.25, to: 523.25, start: now, duration: 1.1, peak: peak * 0.9 });
      tone(ac, { from: 659.25, to: 659.25, start: now + 0.18, duration: 1.3, peak: peak * 0.7 });
      break;
  }
}
