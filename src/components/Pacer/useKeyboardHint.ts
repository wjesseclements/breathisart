import { useEffect, useState } from 'react';

/**
 * True once the user has shown they are on a keyboard.
 *
 * Space / Escape / arrows are real controls that appeared nowhere in the UI.
 * Showing the hint unconditionally would add a line of chrome every pointer
 * user has to ignore, so it waits for the first Tab.
 */
export function useKeyboardHint(): boolean {
  const [used, setUsed] = useState(false);
  useEffect(() => {
    if (used) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') setUsed(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [used]);
  return used;
}
