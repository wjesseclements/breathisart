import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { focusRing } from '../ui';
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

  // Lock the page behind the drawer. Without this the background scrolls under
  // it on touch, and `aria-modal` hides the background from screen readers but
  // not from the keyboard.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    const root = document.getElementById('root');
    const main = root?.querySelector('main');
    main?.setAttribute('inert', '');
    return () => {
      body.style.overflow = prev;
      main?.removeAttribute('inert');
    };
  }, [open]);

  // Focus the panel itself, not the close button: landing on Close announces
  // "close" as the first thing in a panel the user just chose to open.
  useEffect(() => {
    if (open) asideRef.current?.focus();
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
              tabIndex={-1}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto overscroll-contain bg-surface-raised p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] focus:outline-none"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-lg font-light text-ink-display">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close settings"
                  className={`grid h-11 w-11 place-items-center rounded-full text-ink-muted transition-colors hover:text-ink-max ${focusRing}`}
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
