import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SettingsDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Slide-in settings panel. Framer Motion is UI chrome only — never breath timing. */
export function SettingsDrawer({ open, title, onClose, children }: SettingsDrawerProps) {
  return (
    <MotionConfig reducedMotion="user">
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
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-night-soft p-6"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-lg font-light text-whisper">{title}</h2>
                <button
                  type="button"
                  autoFocus
                  onClick={onClose}
                  aria-label="Close settings"
                  className="rounded-full px-3 py-1 text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-breath-teal"
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
