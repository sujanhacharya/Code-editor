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
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 36,
            zIndex: 1500,
            pointerEvents: 'none',
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
  );
}
