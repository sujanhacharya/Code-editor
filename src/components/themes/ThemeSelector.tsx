import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useAppStore } from '@/store';
import { getThemeLabel, getThemeDescription, applyTheme } from '@/utils/theme';
import type { ThemeMode } from '@/types';

const themes: { id: ThemeMode; gradient: string; icon: string }[] = [
  {
    id: 'minimalism',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
    icon: '○',
  },
  {
    id: 'maximalism',
    gradient: 'linear-gradient(135deg, #050510 0%, #1a0a3a 30%, #0a0a2a 60%, #150530 100%)',
    icon: '◈',
  },
  {
    id: 'brutalism',
    gradient: 'linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%)',
    icon: '▣',
  },
];

export function ThemeSelector() {
  const { styleSelectorOpen, setStyleSelectorOpen, theme, setTheme, setIsTransitioning } = useAppStore();

  const handleSelect = (newTheme: ThemeMode) => {
    if (newTheme === theme) return;

    setIsTransitioning(true);
    setStyleSelectorOpen(false);

    // Black overlay transition
    setTimeout(() => {
      setTheme(newTheme);
      applyTheme(newTheme);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 600);
    }, 400);
  };

  return (
    <AnimatePresence>
      {styleSelectorOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setStyleSelectorOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 380,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1001,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>✦</span>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'var(--font-ui)',
                      color: 'var(--fg-primary)',
                    }}
                  >
                    Visual System
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--fg-muted)',
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    Choose your environment
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setStyleSelectorOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--fg-muted)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--fg-primary)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* Theme list */}
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {themes.map((t) => (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: theme === t.id
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-primary)',
                    background: theme === t.id ? 'var(--accent-glow)' : 'var(--bg-surface)',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {/* Preview */}
                  <div
                    style={{
                      width: 48,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      background: t.gradient,
                      border: '1px solid var(--border-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {t.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--fg-primary)',
                        fontFamily: 'var(--font-ui)',
                      }}
                    >
                      {getThemeLabel(t.id)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--fg-tertiary)',
                        fontFamily: 'var(--font-ui)',
                      }}
                    >
                      {getThemeDescription(t.id)}
                    </div>
                  </div>

                  {/* Check */}
                  {theme === t.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--bg-primary)',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={12} />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '10px 20px',
                borderTop: '1px solid var(--border-primary)',
                fontSize: 10,
                color: 'var(--fg-muted)',
                fontFamily: 'var(--font-code)',
                textAlign: 'center',
              }}
            >
              Your code persists across all themes
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
