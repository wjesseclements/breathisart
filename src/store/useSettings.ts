import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  selectedPatternId: string;
  tip478Dismissed: boolean;
  /** Countdown number inside the orb; toggle UI arrives in slice 8. */
  showCountdown: boolean;
  selectPattern: (id: string) => void;
  dismissTip478: () => void;
  setShowCountdown: (show: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      selectedPatternId: 'box',
      tip478Dismissed: false,
      showCountdown: true,
      selectPattern: (id) => set({ selectedPatternId: id }),
      dismissTip478: () => set({ tip478Dismissed: true }),
      setShowCountdown: (show) => set({ showCountdown: show }),
    }),
    { name: 'stillpoint:settings' },
  ),
);
