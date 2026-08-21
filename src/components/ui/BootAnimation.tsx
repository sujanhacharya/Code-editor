import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';

export function BootAnimation() {
  const { bootComplete, setBootComplete } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'exit'>('loading');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase('ready');
          setTimeout(() => setPhase('exit'), 400);
          setTimeout(() => setBootComplete(true), 800);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [setBootComplete]);

  if (bootComplete) return null;

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000000',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            <span style={{ color: '#666' }}>//</span>CODELAB
          </motion.div>

          {/* Progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              width: 200,
            }}
          >
            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 2,
                background: '#111111',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <motion.div
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.2 }}
                style={{
                  height: '100%',
                  background: '#ffffff',
                  borderRadius: 1,
                }}
              />
            </div>

            {/* Status text */}
            <div
              style={{
                fontFamily: 'var(--font-code)',
                fontSize: 10,
                color: '#333333',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {progress < 30
                ? 'Initializing environment...'
                : progress < 60
                ? 'Loading editor...'
                : progress < 90
                ? 'Preparing C++ engine...'
                : 'Ready'}
            </div>

            {/* Percentage */}
            <div
              style={{
                fontFamily: 'var(--font-code)',
                fontSize: 11,
                color: '#222222',
              }}
            >
              {Math.min(Math.round(progress), 100)}%
            </div>
          </motion.div>

          {/* Scanline */}
          <motion.div
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
