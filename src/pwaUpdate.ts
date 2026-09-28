/**
 * Service-worker update handling.
 *
 * `vite-plugin-pwa` is configured with `registerType: 'autoUpdate'`, so a new
 * worker calls `skipWaiting()` and `clientsClaim()` and takes control straight
 * away. What that does NOT do is change the page already on screen: it was
 * rendered from the old precache and keeps those assets until a reload. So a
 * returning visitor reliably sees the *previous* release once, which is
 * exactly what "it looks like an older build" is.
 *
 * Reloading the moment a new worker claims the page would fix that and be
 * hostile here — yanking the page out from under someone mid-breath is the
 * opposite of what this app is for. So the reload waits for a moment when
 * nothing is running.
 */
let updatePending = false;
let reloading = false;
let sessionActive = false;

function reloadIfSafe(): void {
  if (!updatePending || reloading || sessionActive) return;
  reloading = true;
  window.location.reload();
}

/** Called by the session UI so an update never interrupts a breath. */
export function setSessionActive(active: boolean): void {
  sessionActive = active;
  if (!active) reloadIfSafe();
}

export function watchForServiceWorkerUpdate(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  // No controller yet means this is the first install — there is no stale page
  // to replace, so claiming control is not an update.
  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    updatePending = true;
    reloadIfSafe();
  });
}
