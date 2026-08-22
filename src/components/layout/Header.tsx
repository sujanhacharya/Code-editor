import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Square,
  Share2,
  Settings,
  Terminal,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '@/store';

export function Header() {
  const {
    isRunning,
    getActiveFile,
    setSettingsOpen,
    toggleTerminal,
  } = useAppStore();

  const [runState, setRunState] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  // Delegates to the single store action so RUN behaves identically whether it
  // is triggered here, by Cmd+Enter in Monaco, or from the command palette —
  // including opening the output panel without resetting its height.
  const handleRun = useCallback(async () => {
    if (isRunning) return;

    setRunState('running');
    await useAppStore.getState().runCode();

    const history = useAppStore.getState().outputHistory;
    const last = history[history.length - 1];
    setRunState(last?.result?.phase === 'success' ? 'success' : 'error');

    setTimeout(() => setRunState('idle'), 2000);
  }, [isRunning]);

  return (
    <header
      style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--border-primary)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--fg-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ color: 'var(--accent-primary)' }}>//</span>
          CODELAB
        </motion.div>
      </div>

      {/* Center: File name */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: 12,
            color: 'var(--fg-secondary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)',
          }}
        >
          {getActiveFile()?.name || 'untitled.cpp'}
        </span>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Language badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)',
            fontSize: 11,
            fontFamily: 'var(--font-code)',
            color: 'var(--fg-secondary)',
            marginRight: 8,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
            }}
          />
          C++
          <ChevronDown size={12} style={{ opacity: 0.5 }} />
        </div>

        {/* Terminal toggle */}
        <HeaderButton
          icon={<Terminal size={15} />}
          label="Terminal"
          onClick={() => toggleTerminal()}
        />

        {/* Share */}
        <HeaderButton
          icon={<Share2 size={15} />}
          label="Share"
          onClick={() => {
            const file = getActiveFile();
            if (file) {
              navigator.clipboard.writeText(file.content);
            }
          }}
        />

        {/* Settings */}
        <HeaderButton
          icon={<Settings size={15} />}
          label="Settings"
          onClick={() => setSettingsOpen(true)}
        />

        {/* Run button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRun}
          disabled={isRunning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            background:
              runState === 'success'
                ? 'var(--success)'
                : runState === 'error'
                ? 'var(--danger)'
                : 'var(--accent-primary)',
            color: runState === 'success' || runState === 'error' ? '#000' : 'var(--bg-primary)',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-ui)',
            letterSpacing: '0.02em',
            marginLeft: 8,
            transition: 'background var(--transition-fast)',
            opacity: isRunning ? 0.7 : 1,
          }}
        >
          {runState === 'running' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Square size={10} fill="currentColor" />
            </motion.div>
          ) : runState === 'success' ? (
            <span>✓ DONE</span>
          ) : runState === 'error' ? (
            <span>× ERROR</span>
          ) : (
            <Play size={12} fill="currentColor" />
          )}
          {runState === 'running' ? 'RUNNING' : runState === 'success' ? '' : runState === 'error' ? '' : 'RUN'}
        </motion.button>
      </div>
    </header>
  );
}

function HeaderButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-sm)',
        color: 'var(--fg-secondary)',
        transition: 'color var(--transition-fast), background var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = 'var(--fg-primary)';
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = 'var(--fg-secondary)';
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {icon}
    </motion.button>
  );
}
