import { useEffect } from 'react';

/**
 * Holds a screen wake lock while `active` (feature-detected) so phones
 * don't sleep mid-breath. Released on pause/end/unmount; the browser
 * releases it itself when the tab is hidden.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    navigator.wakeLock
      .request('screen')
      .then((lock) => {
        if (cancelled) void lock.release();
        else sentinel = lock;
      })
      .catch(() => {
        // Request can be denied (e.g. battery saver) — breathing still works.
      });
    return () => {
      cancelled = true;
      void sentinel?.release();
    };
  }, [active]);
}
