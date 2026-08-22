import { useEffect } from 'react';
import { useAppStore } from '@/store';

export function useKeyboardShortcuts() {
  const {
    setCommandPaletteOpen,
    toggleTerminal,
    toggleSidebar,
    setSettingsOpen,
    setStyleSelectorOpen,
    clearOutput,
  } = useAppStore();

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
        // One shared implementation, so RUN always reveals the output panel.
        void useAppStore.getState().runCode();
        return;
      }

      // e.code is layout-independent, so this fires on the physical ` key
      // regardless of keyboard layout. Monaco registers the same shortcut
      // internally (see CodeEditor) for when the editor has focus.
      if (isMod && e.code === 'Backquote') {
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
        // Clears execution output only — files, stdin and editor state persist.
        clearOutput();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandPaletteOpen, toggleTerminal, toggleSidebar, setSettingsOpen, setStyleSelectorOpen, clearOutput]);
}
