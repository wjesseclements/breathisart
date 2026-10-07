import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BreathPattern } from '../engine/patterns';

export type ThemePreference = 'dark' | 'light' | 'system';
export type MotionPreference = 'system' | 'reduced';

interface SettingsState {
  selectedPatternId: string;
  showCountdown: boolean;
  customPatterns: BreathPattern[];
  /** Phase tones, off by default (PRD §5). */
  audioCues: boolean;
  /** Shared by phase tones and the timed-session chime. 0 = silent. */
  volume: number;
  haptics: boolean;
  /** Timed session length in minutes; null = open-ended (default). */
  sessionLengthMin: number | null;
  /**
   * Settling beat before the first inhale. A pattern may override it — the
   * physiological sigh sets 0, because it is the panic-button pattern.
   */
  leadInSeconds: number;
  theme: ThemePreference;
  /** 'reduced' forces reduced motion regardless of the OS setting. */
  motionPreference: MotionPreference;
  /** First-visit "Follow the orb" line — shown once, never again. */
  onboardingDismissed: boolean;
  /**
   * Polite `aria-live` phase announcements. On by default because they are the
   * only pacing cue a non-visual user has, but switchable: ~15 announcements a
   * minute with no off switch is worse than useless once the queue lags.
   */
  spokenCues: boolean;
  selectPattern: (id: string) => void;
  dismissOnboarding: () => void;
  setShowCountdown: (show: boolean) => void;
  saveCustomPattern: (pattern: BreathPattern) => void;
  deleteCustomPattern: (id: string) => void;
  setAudioCues: (on: boolean) => void;
  setVolume: (volume: number) => void;
  setHaptics: (on: boolean) => void;
  setSessionLength: (minutes: number | null) => void;
  setLeadIn: (seconds: number) => void;
  setTheme: (theme: ThemePreference) => void;
  setMotionPreference: (preference: MotionPreference) => void;
  setSpokenCues: (on: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      selectedPatternId: 'box',
      showCountdown: true,
      customPatterns: [],
      audioCues: false,
      volume: 0.6,
      haptics: false,
      sessionLengthMin: null,
      leadInSeconds: 3,
      theme: 'dark',
      motionPreference: 'system',
      onboardingDismissed: false,
      spokenCues: true,
      selectPattern: (id) => set({ selectedPatternId: id }),
      dismissOnboarding: () => set({ onboardingDismissed: true }),
      setShowCountdown: (show) => set({ showCountdown: show }),
      saveCustomPattern: (pattern) =>
        set((s) => ({
          customPatterns: s.customPatterns.some((p) => p.id === pattern.id)
            ? s.customPatterns.map((p) => (p.id === pattern.id ? pattern : p))
            : [...s.customPatterns, pattern],
        })),
      deleteCustomPattern: (id) =>
        set((s) => ({
          customPatterns: s.customPatterns.filter((p) => p.id !== id),
          // Deleting the selected pattern falls back to the default.
          selectedPatternId: s.selectedPatternId === id ? 'box' : s.selectedPatternId,
        })),
      setAudioCues: (on) => set({ audioCues: on }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
      setHaptics: (on) => set({ haptics: on }),
      setSessionLength: (minutes) => set({ sessionLengthMin: minutes }),
      setLeadIn: (seconds) => set({ leadInSeconds: Math.max(0, Math.min(10, seconds)) }),
      setTheme: (theme) => set({ theme }),
      setMotionPreference: (preference) => set({ motionPreference: preference }),
      setSpokenCues: (on) => set({ spokenCues: on }),
    }),
    { name: 'stillpoint:settings' },
  ),
);
