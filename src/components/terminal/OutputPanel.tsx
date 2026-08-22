import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Trash2, Maximize2, Minimize2, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatTime } from '@/utils/theme';
import { parseCompilerDiagnostics, countProblems } from '@/utils/diagnostics';
import type { BottomPanel, CompilerDiagnostic, ExecutionPhase, ExecutionResult, OutputEntry as OutputEntryType } from '@/types';

/** How close to the bottom still counts as "pinned" (px). */
const PIN_THRESHOLD = 24;

/**
 * Human-readable label + colour for each execution phase, so a compiler error
 * is never presented as a network failure and vice versa.
 */
function phaseMeta(phase: ExecutionPhase): { label: string; color: string } {
  switch (phase) {
    case 'success':
      return { label: 'SUCCESS', color: 'var(--success)' };
    case 'compile_error':
      return { label: 'COMPILATION ERROR', color: 'var(--danger)' };
    case 'runtime_error':
      return { label: 'RUNTIME ERROR', color: 'var(--danger)' };
    case 'timeout':
      return { label: 'TIMEOUT', color: 'var(--warning)' };
    case 'network_error':
      return { label: 'NETWORK ERROR', color: 'var(--warning)' };
    default:
      return { label: 'DONE', color: 'var(--fg-muted)' };
  }
}

export function OutputPanel() {
  const {
    layout,
    outputHistory,
    stdin,
    isRunning,
    setStdin,
    clearOutput,
    setBottomPanel,
    toggleTerminal,
    maximizeTerminal,
    collapseTerminal,
  } = useAppStore();

  const activeTab = layout.activeTerminalTab || layout.bottomPanel;
  const isMaximized = layout.terminalMaximized;
  const isCollapsed = layout.terminalCollapsed;

  // ---------------------------------------------------------------------------
  // Auto-scroll (spec item 26)
  //
  // The old implementation hunted for the scroll container with
  // querySelector('[style*="flex: 1"]') and drove it from a MutationObserver,
  // which silently broke whenever styles changed. We now hold a direct ref and
  // only scroll while the user is parked at the bottom, so scrolling up to read
  // earlier output is never yanked back down.
  // ---------------------------------------------------------------------------
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef(true);
  const savedTopRef = useRef(0);
  const prevCountRef = useRef(outputHistory.length);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    savedTopRef.current = el.scrollTop;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < PIN_THRESHOLD;
  }, []);

  /**
   * Switching tabs unmounts this container (AnimatePresence mode="wait"), so the
   * effect below runs while the ref is still null. Restoring from the callback
   * ref instead means coming back to OUTPUT lands exactly where the user left
   * off rather than at the top.
   */
  const attachScroll = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node;
    if (!node) return;
    node.scrollTop = pinnedRef.current ? node.scrollHeight : savedTopRef.current;
  }, []);

  useEffect(() => {
    // A brand-new run always brings the user back to the live output.
    if (outputHistory.length > prevCountRef.current) {
      pinnedRef.current = true;
    }
    prevCountRef.current = outputHistory.length;

    const el = scrollRef.current;
    if (!el) return;
    if (pinnedRef.current) {
      el.scrollTop = el.scrollHeight;
      savedTopRef.current = el.scrollTop;
    }
  }, [outputHistory, activeTab]);

  /** Clears ONLY execution output. Source files, stdin, theme and editor state are untouched. */
  const handleClear = useCallback(() => {
    clearOutput();
    pinnedRef.current = true;
    savedTopRef.current = 0;
  }, [clearOutput]);

  // ---------------------------------------------------------------------------
  // PROBLEMS tab (spec item 29): parsed from the most recent real result.
  // ---------------------------------------------------------------------------
  const lastResult = useMemo<ExecutionResult | null>(() => {
    for (let i = outputHistory.length - 1; i >= 0; i--) {
      if (outputHistory[i].result) return outputHistory[i].result;
    }
    return null;
  }, [outputHistory]);

  const diagnostics = useMemo<CompilerDiagnostic[]>(() => {
    if (!lastResult) return [];
    // Timeouts and transport failures carry no compiler diagnostics.
    if (lastResult.phase === 'network_error' || lastResult.phase === 'timeout') return [];
    return parseCompilerDiagnostics(lastResult.stderr);
  }, [lastResult]);

  /**
   * The badge counts errors and warnings only. The "note:" rows g++ hangs off a
   * diagnostic are still listed, but counting them would inflate the number well
   * past the number of things actually wrong.
   */
  const problemCount = useMemo(() => countProblems(diagnostics), [diagnostics]);

  /** Jump Monaco to the diagnostic's line:column without remounting the editor. */
  const gotoDiagnostic = useCallback((d: CompilerDiagnostic) => {
    window.dispatchEvent(
      new CustomEvent('goto-position', { detail: { line: d.line, column: d.column } })
    );
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-primary)',
        overflow: 'hidden',
        // Lets the content area shrink instead of pushing past the panel.
        minHeight: 0,
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
          background: 'var(--bg-secondary)',
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
              {tab === 'problems' && problemCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-hover)',
                    color: 'var(--fg-muted)',
                  }}
                >
                  {problemCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Panel controls. Built from one shared button so maximize, collapse,
            clear and close can never collide the way the duplicated blocks did. */}
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton
            onClick={maximizeTerminal}
            title={isMaximized ? 'Restore terminal' : 'Maximize terminal'}
          >
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </IconButton>

          <IconButton
            onClick={collapseTerminal}
            title={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
          >
            <ChevronDown
              size={12}
              style={{
                transform: isCollapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--transition-fast)',
              }}
            />
          </IconButton>

          <IconButton onClick={handleClear} title="Clear output">
            <Trash2 size={12} />
          </IconButton>

          <IconButton onClick={toggleTerminal} title="Close panel (⌘`)">
            <X size={12} />
          </IconButton>
        </div>
      </div>

      {/* Content area. Collapsed shows the tab bar only. */}
      {!isCollapsed && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            // The scroll lives on the inner content region, not here, so the
            // panel itself never double-scrolls (spec items 14-17).
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'output' && (
              <motion.div
                key="output"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}
              >
                {/* Stdin: fixed, compact, never eats the output area (item 18) */}
                <div
                  style={{
                    flexShrink: 0,
                    padding: '10px 16px 8px',
                    borderBottom: '1px solid var(--border-primary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--fg-muted)',
                        fontFamily: 'var(--font-ui)',
                      }}
                    >
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
                      // Hard cap: stdin stays a small strip even with lots of input.
                      maxHeight: 64,
                      overflowY: 'auto',
                      padding: '6px 10px',
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

                {/* THE scroll container. Everything long lives in here. */}
                <div
                  ref={attachScroll}
                  onScroll={handleScroll}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'auto',
                    minHeight: 0,
                    padding: '12px 16px',
                  }}
                >
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
                    // Chronological order: newest at the bottom, which is what
                    // scroll-to-bottom auto-scrolling expects.
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {outputHistory.map((entry) => (
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
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0,
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
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                  padding: diagnostics.length === 0 ? '12px 16px' : '6px 0',
                }}
              >
                {diagnostics.length === 0 ? (
                  <div
                    style={{
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
                    {isRunning ? 'Compiling…' : 'No problems detected'}
                  </div>
                ) : (
                  diagnostics.map((d, i) => (
                    <ProblemRow
                      key={`${d.file}:${d.line}:${d.column}:${i}`}
                      diagnostic={d}
                      onSelect={gotoDiagnostic}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/** Shared 24x24 header button — one definition, used by every panel control. */
function IconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      aria-label={title}
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
        (e.currentTarget as HTMLElement).style.color = 'var(--fg-primary)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)';
      }}
    >
      {children}
    </motion.button>
  );
}

/** One clickable diagnostic row: severity, message, then file:line:col. */
function ProblemRow({
  diagnostic,
  onSelect,
}: {
  diagnostic: CompilerDiagnostic;
  onSelect: (d: CompilerDiagnostic) => void;
}) {
  const color =
    diagnostic.severity === 'error'
      ? 'var(--danger)'
      : diagnostic.severity === 'warning'
      ? 'var(--warning)'
      : 'var(--fg-muted)';

  return (
    <button
      onClick={() => onSelect(diagnostic)}
      title={`Go to ${diagnostic.file}:${diagnostic.line}:${diagnostic.column}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        textAlign: 'left',
        padding: '5px 16px',
        fontFamily: 'var(--font-code)',
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--fg-secondary)',
        transition: 'background var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <AlertTriangle size={12} style={{ color, flexShrink: 0, marginTop: 3 }} />
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'pre-wrap' }}>{diagnostic.message}</span>
      <span style={{ color: 'var(--fg-muted)', fontSize: 11, flexShrink: 0 }}>
        {diagnostic.file}:{diagnostic.line}:{diagnostic.column}
      </span>
    </button>
  );
}

function OutputEntry({ entry }: { entry: OutputEntryType }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (entry.result) {
      navigator.clipboard.writeText(entry.result.stdout + entry.result.stderr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const meta = entry.result ? phaseMeta(entry.result.phase) : null;
  const dotColor = !entry.result
    ? 'var(--warning)'
    : meta!.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-primary)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Entry header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              flexShrink: 0,
              background: dotColor,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: 11,
              color: 'var(--fg-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            $ {entry.command}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Explicit phase label so the cause is never ambiguous (item 31). */}
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: meta ? meta.color : 'var(--fg-muted)',
            }}
          >
            {meta ? meta.label : 'RUNNING…'}
          </span>
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

      {/* Output content. No max-height and no inner scrollbar: the entry grows
          to its full size and the panel's single scroll container handles it,
          so long compiler output is never clipped (spec items 15-16). */}
      <div
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-code)',
          fontSize: 12,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {entry.result?.stdout && (
          <div style={{ color: 'var(--fg-primary)' }}>{entry.result.stdout}</div>
        )}
        {entry.result?.stderr && (
          <div
            style={{
              color: entry.result.phase === 'success' ? 'var(--warning)' : 'var(--danger)',
              marginTop: entry.result.stdout ? 8 : 0,
            }}
          >
            {entry.result.stderr}
          </div>
        )}
        {!entry.result && (
          <div style={{ color: 'var(--fg-muted)' }}>Compiling and running…</div>
        )}
        {entry.result && !entry.result.stdout && !entry.result.stderr && (
          <div style={{ color: 'var(--fg-muted)' }}>(no output)</div>
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
            <span>Exit code: {entry.result.exitCode}</span>
            <span>Time: {formatTime(entry.result.executionTime)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
