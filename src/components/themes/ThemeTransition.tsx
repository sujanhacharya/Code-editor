import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';

export function ThemeTransition() {
  const { isTransitioning } = useAppStore();

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000000',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Transition effect: expanding circle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 15, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: '1px solid var(--accent-primary)',
              opacity: 0.3,
            }}
          />

          {/* Scanline effect */}
          <motion.div
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ duration: 0.6, ease: 'linear', delay: 0.1 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
              opacity: 0.5,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
