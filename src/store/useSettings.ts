import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BreathPattern } from '../engine/patterns';

interface SettingsState {
  selectedPatternId: string;
  tip478Dismissed: boolean;
  /** Countdown number inside the orb; toggle UI arrives in slice 8. */
  showCountdown: boolean;
  customPatterns: BreathPattern[];
  selectPattern: (id: string) => void;
  dismissTip478: () => void;
  setShowCountdown: (show: boolean) => void;
  /** Adds a new custom pattern, or replaces it if the id already exists. */
  saveCustomPattern: (pattern: BreathPattern) => void;
  deleteCustomPattern: (id: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      selectedPatternId: 'box',
      tip478Dismissed: false,
      showCountdown: true,
      customPatterns: [],
      selectPattern: (id) => set({ selectedPatternId: id }),
      dismissTip478: () => set({ tip478Dismissed: true }),
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
    }),
    { name: 'stillpoint:settings' },
  ),
);
