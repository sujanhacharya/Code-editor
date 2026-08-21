import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';

export function useKeyboardShortcuts() {
  const {
    setCommandPaletteOpen,
    setIsRunning,
    toggleTerminal,
    toggleSidebar,
    setSettingsOpen,
    setStyleSelectorOpen,
    getActiveFile,
    addOutput,
    clearOutput,
    stdin,
  } = useAppStore();

  const handleRun = useCallback(async () => {
    const file = getActiveFile();
    if (!file || useAppStore.getState().isRunning) return;

    setIsRunning(true);

    const { CppExecutionService } = await import('@/utils/execution');
    const result = await CppExecutionService.execute(file.content, stdin);

    const entry = {
      id: Math.random().toString(36).substring(2, 10),
      timestamp: Date.now(),
      command: `./${file.name.replace('.cpp', '')}`,
      result,
      status: result.exitCode === 0 ? 'success' as const : 'error' as const,
    };

    addOutput(entry);
    setIsRunning(false);
  }, [getActiveFile, setIsRunning, addOutput, stdin]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (isMod && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
        return;
      }

      if (isMod && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
        return;
      }

      if (isMod && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (isMod && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setSettingsOpen(false);
        setStyleSelectorOpen(false);
        return;
      }

      if (isMod && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        clearOutput();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, setCommandPaletteOpen, toggleTerminal, toggleSidebar, setSettingsOpen, setStyleSelectorOpen, clearOutput]);
}
