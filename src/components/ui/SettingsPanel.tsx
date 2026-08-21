import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '@/store';
import { applyTheme } from '@/utils/theme';
import type { ThemeMode } from '@/types';

export function SettingsPanel() {
  const {
    settingsOpen,
    setSettingsOpen,
    editorSettings,
    updateEditorSettings,
    theme,
    setTheme,
    setIsTransitioning,
  } = useAppStore();

  const handleThemeChange = (newTheme: ThemeMode) => {
    if (newTheme === theme) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setTheme(newTheme);
      applyTheme(newTheme);
      setTimeout(() => setIsTransitioning(false), 600);
    }, 400);
  };

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 1500,
            }}
          />

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 380,
              background: 'var(--bg-elevated)',
              borderLeft: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1501,
              display: 'flex',
              flexDirection: 'column',
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
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'var(--font-ui)',
                  color: 'var(--fg-primary)',
                }}
              >
                Settings
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSettingsOpen(false)}
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

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              {/* Editor section */}
              <SettingsSection title="Editor">
                <SettingsRow label="Font Size">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range"
                      min={10}
                      max={24}
                      value={editorSettings.fontSize}
                      onChange={(e) =>
                        updateEditorSettings({ fontSize: Number(e.target.value) })
                      }
                      style={{ width: 100, accentColor: 'var(--accent-primary)' }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-code)',
                        color: 'var(--fg-secondary)',
                        minWidth: 24,
                      }}
                    >
                      {editorSettings.fontSize}
                    </span>
                  </div>
                </SettingsRow>

                <SettingsRow label="Tab Size">
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[2, 4].map((size) => (
                      <motion.button
                        key={size}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateEditorSettings({ tabSize: size })}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 12,
                          fontFamily: 'var(--font-code)',
                          background:
                            editorSettings.tabSize === size
                              ? 'var(--accent-primary)'
                              : 'var(--bg-surface)',
                          color:
                            editorSettings.tabSize === size
                              ? 'var(--bg-primary)'
                              : 'var(--fg-secondary)',
                          border: '1px solid var(--border-primary)',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </SettingsRow>

                <SettingsRow label="Word Wrap">
                  <Toggle
                    checked={editorSettings.wordWrap === 'on'}
                    onChange={(v) =>
                      updateEditorSettings({ wordWrap: v ? 'on' : 'off' })
                    }
                  />
                </SettingsRow>

                <SettingsRow label="Minimap">
                  <Toggle
                    checked={editorSettings.minimap}
                    onChange={(v) => updateEditorSettings({ minimap: v })}
                  />
                </SettingsRow>

                <SettingsRow label="Line Numbers">
                  <Toggle
                    checked={editorSettings.lineNumbers}
                    onChange={(v) => updateEditorSettings({ lineNumbers: v })}
                  />
                </SettingsRow>

                <SettingsRow label="Auto Save">
                  <Toggle
                    checked={editorSettings.autoSave}
                    onChange={(v) => updateEditorSettings({ autoSave: v })}
                  />
                </SettingsRow>
              </SettingsSection>

              {/* Appearance section */}
              <SettingsSection title="Appearance">
                <SettingsRow label="Theme">
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['minimalism', 'maximalism', 'brutalism'] as ThemeMode[]).map((t) => (
                      <motion.button
                        key={t}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleThemeChange(t)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 11,
                          fontFamily: 'var(--font-ui)',
                          textTransform: 'capitalize',
                          background:
                            theme === t
                              ? 'var(--accent-primary)'
                              : 'var(--bg-surface)',
                          color:
                            theme === t
                              ? 'var(--bg-primary)'
                              : 'var(--fg-secondary)',
                          border: '1px solid var(--border-primary)',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </SettingsRow>
              </SettingsSection>

              {/* Keyboard shortcuts */}
              <SettingsSection title="Keyboard Shortcuts">
                <ShortcutRow keys="⌘ K" action="Command Palette" />
                <ShortcutRow keys="⌘ Enter" action="Run C++" />
                <ShortcutRow keys="⌘ `" action="Toggle Terminal" />
                <ShortcutRow keys="⌘ B" action="Toggle Sidebar" />
                <ShortcutRow keys="⌘ ," action="Open Settings" />
                <ShortcutRow keys="⌘ ⇧ L" action="Clear Output" />
                <ShortcutRow keys="Escape" action="Close Panel" />
              </SettingsSection>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--fg-muted)',
          fontFamily: 'var(--font-ui)',
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-surface)',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontFamily: 'var(--font-ui)',
          color: 'var(--fg-secondary)',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ShortcutRow({ keys, action }: { keys: string; action: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-surface)',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontFamily: 'var(--font-ui)',
          color: 'var(--fg-secondary)',
        }}
      >
        {action}
      </span>
      <span
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-code)',
          color: 'var(--fg-muted)',
          padding: '2px 6px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {keys}
      </span>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => onChange(!checked)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: checked ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
        padding: 2,
        display: 'flex',
        alignItems: 'center',
        transition: 'background var(--transition-fast)',
      }}
    >
      <motion.div
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: checked ? 'var(--bg-primary)' : 'var(--fg-muted)',
        }}
      />
    </motion.button>
  );
}
