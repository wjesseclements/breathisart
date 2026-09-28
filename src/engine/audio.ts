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

/**
 * Minimum attack and release, in seconds.
 *
 * The old cues used a 40ms attack, which is a click — and a click in an app
 * whose entire thesis is calm is a bug, not a preference. 200ms is past the
 * threshold where the onset reads as a transient.
 */
const ENVELOPE_S = 0.2;

/**
 * Two slightly detuned sines through a lowpass, rather than one bare
 * oscillator. The beating between them gives the tone some body, and rolling
 * the top off stops it sounding like a test signal.
 */
function tone(ac: AudioContext, { from, to, start, duration, peak }: ToneOpts): void {
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.max(from, to) * 3.2, start);
  filter.Q.value = 0.6;

  // The attack and release must fit inside the tone, however short it is.
  const env = Math.min(ENVELOPE_S, duration * 0.45);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + env);
  gain.gain.setValueAtTime(peak, start + duration - env);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  for (const detune of [-4, 4]) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(from, start);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    osc.connect(gain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }
  gain.connect(filter).connect(ac.destination);
}

/** Diagnostic: where the audio engine currently stands. */
export function getAudioEngineState(): 'uninitialized' | 'unavailable' | AudioContextState {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return 'unavailable';
  return ctx ? ctx.state : 'uninitialized';
}

/**
 * Creates/resumes the AudioContext. Must be called from inside a user
 * gesture (click/keydown) — browsers refuse audio started elsewhere.
 * Wired to the app's first pointerdown/keydown; no-op afterwards.
 *
 * Does nothing if no context exists yet and audio is off: constructing an
 * AudioContext for a user who never enables cues costs a real audio thread
 * for nothing.
 */
export function unlockAudio(): void {
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
}

/** Called the first time a cue is actually wanted. */
export function ensureAudio(): void {
  const ac = getContext();
  if (ac && ac.state === 'suspended') void ac.resume();
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

  const schedule = () => {
    const now = ac.currentTime;
    const peak = 0.25 * Math.min(1, volume);
    switch (kind) {
      case 'inhale':
        tone(ac, { from: 240, to: 400, start: now, duration: 0.7, peak: peak * 0.8 });
        break;
      case 'exhale':
        tone(ac, { from: 400, to: 220, start: now, duration: 0.95, peak: peak * 0.8 });
        break;
      case 'hold':
        // Was a 0.12s pip -- a bare click. A soft, longer, quieter note reads
        // as "settle here" rather than as a notification.
        tone(ac, { from: 300, to: 296, start: now, duration: 0.55, peak: peak * 0.4 });
        break;
      case 'chime':
        tone(ac, { from: 523.25, to: 523.25, start: now, duration: 1.4, peak: peak * 0.8 });
        tone(ac, { from: 659.25, to: 659.25, start: now + 0.22, duration: 1.7, peak: peak * 0.6 });
        break;
    }
  };

  // Scheduling against a suspended context's frozen clock produces
  // silence — resume first, then schedule against the live clock.
  if (ac.state === 'suspended') {
    ac.resume().then(schedule, () => {});
  } else {
    schedule();
  }
}
