import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  selectedPatternId: string;
  tip478Dismissed: boolean;
  selectPattern: (id: string) => void;
  dismissTip478: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      selectedPatternId: 'box',
      tip478Dismissed: false,
      selectPattern: (id) => set({ selectedPatternId: id }),
      dismissTip478: () => set({ tip478Dismissed: true }),
    }),
    { name: 'stillpoint:settings' },
  ),
);
