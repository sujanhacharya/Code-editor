import React, { useEffect, useState, useCallback, useRef } from 'react';
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

export default function App() {
  const {
    theme,
    layout,
    bootComplete,
    setExplorerWidth,
    setTerminalHeight,
    toggleTerminal,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Mark mounted after boot
  useEffect(() => {
    if (bootComplete) {
      setMounted(true);
    }
  }, [bootComplete]);

  useKeyboardShortcuts();

  // Handle run event from editor keyboard shortcut
  useEffect(() => {
    const handler = async () => {
      const state = useAppStore.getState();
      const file = state.getActiveFile();
      if (!file || state.isRunning) return;

      state.setIsRunning(true);
      const { CppExecutionService } = await import('@/utils/execution');
      const result = await CppExecutionService.execute(file.content, state.stdin);
      state.addOutput({
        id: Math.random().toString(36).substring(2, 10),
        timestamp: Date.now(),
        command: `./${file.name.replace('.cpp', '')}`,
        result,
        status: result.exitCode === 0 ? 'success' : 'error',
      });
      state.setIsRunning(false);
    };

    window.addEventListener('run-cpp', handler);
    return () => window.removeEventListener('run-cpp', handler as EventListener);
  }, []);

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
                }}
              >
                {/* Editor + Explorer */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    overflow: 'hidden',
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
                      animate={{ height: layout.terminalHeight, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      <ResizablePanel
                        direction="vertical"
                        size={layout.terminalHeight}
                        minSize={100}
                        maxSize={500}
                        onResize={handleTerminalResize}
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
