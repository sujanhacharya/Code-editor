import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Copy, Trash2, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatTime } from '@/utils/theme';

type BottomPanel = 'terminal' | 'output' | 'problems';

export function OutputPanel() {
  const {
    layout,
    outputHistory,
    stdin,
    setStdin,
    clearOutput,
    setBottomPanel,
    toggleTerminal,
  } = useAppStore();

  const activeTab = layout.bottomPanel;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-primary)',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-primary)',
          padding: '0 8px',
          height: 34,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 0, height: '100%' }}>
          {(['output', 'terminal', 'problems'] as BottomPanel[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setBottomPanel(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 12px',
                height: '100%',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-ui)',
                color: activeTab === tab ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                borderBottom: activeTab === tab
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
                transition: 'color var(--transition-fast), border-color var(--transition-fast)',
              }}
            >
              {tab === 'output' && <Terminal size={12} />}
              {tab}
              {tab === 'problems' && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-hover)',
                    color: 'var(--fg-muted)',
                  }}
                >
                  0
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={clearOutput}
            title="Clear"
            style={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--fg-muted)',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--fg-secondary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)';
            }}
          >
            <Trash2 size={12} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTerminal}
            title="Close"
            style={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--fg-muted)',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--fg-secondary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)';
            }}
          >
            <X size={12} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'output' && (
            <motion.div
              key="output"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              {/* Stdin input area */}
              <div style={{ marginBottom: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--fg-muted)',
                    fontFamily: 'var(--font-ui)',
                  }}>
                    Input (stdin)
                  </span>
                </div>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Optional program input..."
                  rows={2}
                  style={{
                    width: '100%',
                    resize: 'none',
                    padding: '8px 10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--fg-primary)',
                    fontFamily: 'var(--font-code)',
                    fontSize: 12,
                    lineHeight: 1.5,
                    outline: 'none',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = 'var(--accent-primary)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = 'var(--border-primary)';
                  }}
                />
              </div>

              {/* Output */}
              <div style={{ flex: 1, overflow: 'auto' }}>
              {outputHistory.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: 8,
                    color: 'var(--fg-muted)',
                    fontFamily: 'var(--font-code)',
                    fontSize: 12,
                  }}
                >
                  <Terminal size={20} style={{ opacity: 0.3 }} />
                  <span>Output will appear here</span>
                  <span style={{ fontSize: 10, opacity: 0.6 }}>
                    Press Ctrl+Enter or click RUN to execute
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...outputHistory].reverse().map((entry) => (
                    <OutputEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
              </div>
            </motion.div>
          )}

          {activeTab === 'terminal' && (
            <motion.div
              key="terminal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '12px 16px',
                fontFamily: 'var(--font-code)',
                fontSize: 12,
                color: 'var(--fg-secondary)',
              }}
            >
              <div style={{ color: 'var(--fg-muted)', marginBottom: 8 }}>
                $ <span style={{ color: 'var(--fg-secondary)' }}>Terminal support coming soon</span>
              </div>
              <div style={{ color: 'var(--fg-muted)' }}>
                Use the OUTPUT tab to see execution results.
              </div>
            </motion.div>
          )}

          {activeTab === 'problems' && (
            <motion.div
              key="problems"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--fg-muted)',
                fontFamily: 'var(--font-code)',
                fontSize: 12,
                gap: 8,
              }}
            >
              <AlertTriangle size={14} style={{ opacity: 0.3 }} />
              No problems detected
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OutputEntry({ entry }: { entry: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (entry.result) {
      navigator.clipboard.writeText(entry.result.stdout + entry.result.stderr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Entry header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background:
                entry.status === 'success'
                  ? 'var(--success)'
                  : entry.status === 'error'
                  ? 'var(--danger)'
                  : 'var(--warning)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: 11,
              color: 'var(--fg-secondary)',
            }}
          >
            $ {entry.command}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {entry.result && (
            <span
              style={{
                fontFamily: 'var(--font-code)',
                fontSize: 10,
                color: 'var(--fg-muted)',
              }}
            >
              {formatTime(entry.result.executionTime)}
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            style={{
              color: copied ? 'var(--success)' : 'var(--fg-muted)',
              fontSize: 10,
              fontFamily: 'var(--font-code)',
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </motion.button>
        </div>
      </div>

      {/* Output content */}
      <div
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-code)',
          fontSize: 12,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          maxHeight: 200,
          overflow: 'auto',
        }}
      >
        {entry.result?.stdout && (
          <div style={{ color: 'var(--fg-primary)' }}>{entry.result.stdout}</div>
        )}
        {entry.result?.stderr && (
          <div style={{ color: 'var(--danger)', marginTop: entry.result.stdout ? 8 : 0 }}>
            {entry.result.stderr}
          </div>
        )}
        {entry.result && (
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid var(--border-primary)',
              color: 'var(--fg-muted)',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>
              Exit code: {entry.result.exitCode}
            </span>
            <span>
              Time: {formatTime(entry.result.executionTime)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
