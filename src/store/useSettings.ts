import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BreathPattern } from '../engine/patterns';

export type ThemePreference = 'dark' | 'light' | 'system';
export type MotionPreference = 'system' | 'reduced';

interface SettingsState {
  selectedPatternId: string;
  tip478Dismissed: boolean;
  showCountdown: boolean;
  customPatterns: BreathPattern[];
  /** Phase tones, off by default (PRD §5). */
  audioCues: boolean;
  /** Shared by phase tones and the timed-session chime. 0 = silent. */
  volume: number;
  haptics: boolean;
  /** Timed session length in minutes; null = open-ended (default). */
  sessionLengthMin: number | null;
  theme: ThemePreference;
  /** 'reduced' forces reduced motion regardless of the OS setting. */
  motionPreference: MotionPreference;
  /** First-visit "Follow the orb" line — shown once, never again. */
  onboardingDismissed: boolean;
  selectPattern: (id: string) => void;
  dismissTip478: () => void;
  dismissOnboarding: () => void;
  setShowCountdown: (show: boolean) => void;
  saveCustomPattern: (pattern: BreathPattern) => void;
  deleteCustomPattern: (id: string) => void;
  setAudioCues: (on: boolean) => void;
  setVolume: (volume: number) => void;
  setHaptics: (on: boolean) => void;
  setSessionLength: (minutes: number | null) => void;
  setTheme: (theme: ThemePreference) => void;
  setMotionPreference: (preference: MotionPreference) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      selectedPatternId: 'box',
      tip478Dismissed: false,
      showCountdown: true,
      customPatterns: [],
      audioCues: false,
      volume: 0.6,
      haptics: false,
      sessionLengthMin: null,
      theme: 'dark',
      motionPreference: 'system',
      onboardingDismissed: false,
      selectPattern: (id) => set({ selectedPatternId: id }),
      dismissTip478: () => set({ tip478Dismissed: true }),
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
      setTheme: (theme) => set({ theme }),
      setMotionPreference: (preference) => set({ motionPreference: preference }),
    }),
    { name: 'stillpoint:settings' },
  ),
);
