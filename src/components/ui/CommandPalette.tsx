import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Terminal,
  PanelLeftClose,
  Settings,
  Sparkles,
  File,
  Trash2,
  WrapText,
  Map,
  Hash,
} from 'lucide-react';
import { useAppStore } from '@/store';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleTerminal,
    toggleSidebar,
    setSettingsOpen,
    setStyleSelectorOpen,
    createFile,
    clearOutput,
    updateEditorSettings,
    editorSettings,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'run',
      label: 'Run C++',
      icon: <Play size={14} />,
      shortcut: '⌘ Enter',
      category: 'Execution',
      action: () => {
        setCommandPaletteOpen(false);
        // Same store action as the RUN button and Cmd+Enter.
        void useAppStore.getState().runCode();
      },
    },
    {
      id: 'new-file',
      label: 'New C++ File',
      icon: <File size={14} />,
      shortcut: '⌘ N',
      category: 'Files',
      action: () => {
        createFile('untitled.cpp');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle-terminal',
      label: 'Toggle Terminal',
      icon: <Terminal size={14} />,
      shortcut: '⌘ `',
      category: 'View',
      action: () => {
        toggleTerminal();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      icon: <PanelLeftClose size={14} />,
      shortcut: '⌘ B',
      category: 'View',
      action: () => {
        toggleSidebar();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'change-style',
      label: 'Change Visual Style',
      icon: <Sparkles size={14} />,
      category: 'Appearance',
      action: () => {
        setStyleSelectorOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      icon: <Settings size={14} />,
      shortcut: '⌘ ,',
      category: 'Preferences',
      action: () => {
        setSettingsOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'clear-output',
      label: 'Clear Output',
      icon: <Trash2 size={14} />,
      shortcut: '⌘ ⇧ L',
      category: 'Execution',
      action: () => {
        clearOutput();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle-wordwrap',
      label: `Toggle Word Wrap (${editorSettings.wordWrap === 'on' ? 'On' : 'Off'})`,
      icon: <WrapText size={14} />,
      category: 'Editor',
      action: () => {
        updateEditorSettings({
          wordWrap: editorSettings.wordWrap === 'on' ? 'off' : 'on',
        });
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle-minimap',
      label: `Toggle Minimap (${editorSettings.minimap ? 'On' : 'Off'})`,
      icon: <Map size={14} />,
      category: 'Editor',
      action: () => {
        updateEditorSettings({ minimap: !editorSettings.minimap });
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle-linenumbers',
      label: `Toggle Line Numbers (${editorSettings.lineNumbers ? 'On' : 'Off'})`,
      icon: <Hash size={14} />,
      category: 'Editor',
      action: () => {
        updateEditorSettings({ lineNumbers: !editorSettings.lineNumbers });
        setCommandPaletteOpen(false);
      },
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    },
    [filtered, selectedIndex, setCommandPaletteOpen]
  );

  // Group by category
  const grouped = filtered.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, Command[]>
  );

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000,
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 480,
              maxHeight: 400,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 2001,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search input */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>⌘</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  fontFamily: 'var(--font-ui)',
                  color: 'var(--fg-primary)',
                }}
              />
            </div>

            {/* Commands list */}
            <div style={{ overflow: 'auto', flex: 1, padding: '8px' }}>
              {Object.entries(grouped).map(([category, cmds]) => (
                <div key={category} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--fg-muted)',
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    {category}
                  </div>
                  {cmds.map((cmd) => {
                    const globalIndex = filtered.indexOf(cmd);
                    return (
                      <motion.button
                        key={cmd.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          width: '100%',
                          textAlign: 'left',
                          background:
                            globalIndex === selectedIndex
                              ? 'var(--bg-surface-hover)'
                              : 'transparent',
                          color:
                            globalIndex === selectedIndex
                              ? 'var(--fg-primary)'
                              : 'var(--fg-secondary)',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <span style={{ width: 16, display: 'flex', justifyContent: 'center', color: 'var(--fg-muted)' }}>
                          {cmd.icon}
                        </span>
                        <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--font-ui)' }}>
                          {cmd.label}
                        </span>
                        {cmd.shortcut && (
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
                            {cmd.shortcut}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: 'var(--fg-muted)',
                    fontSize: 13,
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  No commands found
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
