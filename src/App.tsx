import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { applyTheme } from '@/utils/theme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ResizablePanel } from '@/components/layout/ResizablePanel';
import { FileExplorer } from '@/components/editor/FileExplorer';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { OutputPanel } from '@/components/terminal/OutputPanel';
import { ThemeSelector } from '@/components/themes/ThemeSelector';
import { ThemeTransition } from '@/components/themes/ThemeTransition';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { SettingsPanel } from '@/components/ui/SettingsPanel';
import { BootAnimation } from '@/components/ui/BootAnimation';
import { Scene3D } from '@/components/three/Scene3D';
import { CSSBackground } from '@/components/three/CSSBackground';
import {
  TERMINAL_COLLAPSED_HEIGHT,
  TERMINAL_MIN_HEIGHT,
  getTerminalMaxHeight,
} from '@/utils/terminalGeometry';

export default function App() {
  const {
    theme,
    layout,
    bootComplete,
    isTerminalResizing,
    setExplorerWidth,
    setTerminalHeight,
    maximizeTerminal,
    setTerminalResizing,
    syncTerminalToViewport,
  } = useAppStore();

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useKeyboardShortcuts();

  // Run requests from Monaco (Cmd+Enter) and the command palette funnel through
  // the single store action so RUN behaves identically everywhere.
  useEffect(() => {
    const handler = () => {
      void useAppStore.getState().runCode();
    };
    window.addEventListener('run-cpp', handler);
    return () => window.removeEventListener('run-cpp', handler);
  }, []);

  // Keep the terminal within bounds when the window is resized. This is what
  // makes the height responsive instead of permanently fixed.
  useEffect(() => {
    const onResize = () => syncTerminalToViewport();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncTerminalToViewport]);

  const handleTerminalResize = useCallback(
    (size: number) => {
      setTerminalHeight(size);
    },
    [setTerminalHeight]
  );

  const handleExplorerResize = useCallback(
    (size: number) => {
      setExplorerWidth(size);
    },
    [setExplorerWidth]
  );

  const isCollapsed = layout.terminalCollapsed;

  // The rendered height: collapsed shows only the tab bar, otherwise the
  // user's chosen (already clamped) height.
  const terminalHeight = isCollapsed
    ? TERMINAL_COLLAPSED_HEIGHT
    : layout.terminalHeight;

  const terminalMaxSize = getTerminalMaxHeight();

  return (
    <>
      <BootAnimation />

      {bootComplete && (
        <>
          {/* Backgrounds */}
          <CSSBackground />
          <Scene3D />

          {/* Main app */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1,
            }}
          >
            {/* Header */}
            <Header />

            {/* Main content */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
              }}
            >
              {/* Sidebar */}
              <AnimatePresence>
                {layout.sidebarOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'var(--sidebar-width)', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', flexShrink: 0 }}
                  >
                    <Sidebar />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main area */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  // Allows the editor row to shrink as the terminal grows,
                  // instead of overflowing and forcing page-level scroll.
                  minWidth: 0,
                  minHeight: 0,
                }}
              >
                {/* Editor + Explorer */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    overflow: 'hidden',
                    minWidth: 0,
                    minHeight: 0,
                  }}
                >
                  {/* Explorer */}
                  <AnimatePresence>
                    {layout.explorerOpen && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: layout.explorerWidth, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          overflow: 'hidden',
                          flexShrink: 0,
                          borderRight: '1px solid var(--border-primary)',
                        }}
                      >
                        <ResizablePanel
                          direction="horizontal"
                          size={layout.explorerWidth}
                          minSize={180}
                          maxSize={400}
                          onResize={handleExplorerResize}
                        >
                          <FileExplorer />
                        </ResizablePanel>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Code Editor */}
                  <div
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      position: 'relative',
                      minWidth: 0,
                      minHeight: 0,
                    }}
                  >
                    <CodeEditor />
                  </div>
                </div>

                {/* Bottom panel */}
                <AnimatePresence>
                  {layout.terminalOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: terminalHeight, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      // Animate open/close and maximize, but follow the pointer
                      // instantly while dragging so the resize feels direct.
                      transition={{ duration: isTerminalResizing ? 0 : 0.2 }}
                      style={{
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      <ResizablePanel
                        direction="vertical"
                        handleEdge="start"
                        size={layout.terminalHeight}
                        minSize={TERMINAL_MIN_HEIGHT}
                        maxSize={terminalMaxSize}
                        onResize={handleTerminalResize}
                        onHandleDoubleClick={maximizeTerminal}
                        onResizeStateChange={setTerminalResizing}
                        // While collapsed the panel is only a tab bar, but its
                        // stored size is still ~320px; keeping the handle live
                        // would make the first drag pixel snap it wide open.
                        collapsed={isCollapsed}
                      >
                        <OutputPanel />
                      </ResizablePanel>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Status bar */}
            <div
              style={{
                height: 24,
                borderTop: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                fontSize: 11,
                fontFamily: 'var(--font-code)',
                color: 'var(--fg-muted)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span>C++</span>
                <span>UTF-8</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--success)',
                    }}
                  />
                  READY
                </span>
                <span>⌘ K for commands</span>
              </div>
            </div>
          </div>

          {/* Overlays */}
          <ThemeSelector />
          <ThemeTransition />
          <CommandPalette />
          <SettingsPanel />
        </>
      )}
    </>
  );
}
