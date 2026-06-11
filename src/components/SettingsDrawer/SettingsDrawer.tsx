import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../Pacer/usePrefersReducedMotion';

interface SettingsDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Slide-in settings panel. Framer Motion is UI chrome only — never breath timing. */
export function SettingsDrawer({ open, title, onClose, children }: SettingsDrawerProps) {
  // Honors the in-app motion override as well as the OS setting.
  const reducedMotion = usePrefersReducedMotion();
  const asideRef = useRef<HTMLElement>(null);

  // Keep Tab cycling inside the dialog (aria-modal hides the background
  // from screen readers but not from the keyboard).
  const trapFocus = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Tab' || !asideRef.current) return;
    const focusable = Array.from(asideRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('disabled'),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Return focus to whatever opened the drawer when it closes.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [open]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              ref={asideRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              onKeyDown={trapFocus}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-white dark:bg-night-soft p-6"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-lg font-light text-slate-700 dark:text-whisper">
                  {title}
                </h2>
                <button
                  type="button"
                  autoFocus
                  onClick={onClose}
                  aria-label="Close settings"
                  className="rounded-full px-3 py-1 text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal"
                >
                  ✕
                </button>
              </div>
              {children}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
