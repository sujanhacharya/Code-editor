import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToToasts, type ToastPayload } from '@/utils/toast';

/** Short enough to stay out of the way, long enough to read. */
const VISIBLE_MS = 2200;

/**
 * A single subtle notification pinned above the status bar. Not a modal: it
 * never takes focus, never blocks input (pointerEvents: none) and dismisses
 * itself.
 */
export function Toast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => subscribeToToasts(setToast), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      // Only clear the toast we were told about, so a newer one is not cut short.
      setToast((current) => (current && current.id === toast.id ? null : current));
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    // The live region is mounted for the whole session and only its text
    // changes. Screen readers ignore a region that appears already populated,
    // so inserting the announcement together with its container (the obvious
    // way to write this) would silently never be read out.
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 36,
        // Above the command palette's backdrop (2000) so a toast triggered from
        // the palette is not dimmed by its fade-out.
        zIndex: 2100,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toast && (
          // A stable key: consecutive downloads swap the text in place instead
          // of stacking an exiting toast underneath an entering one.
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--fg-secondary)',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
