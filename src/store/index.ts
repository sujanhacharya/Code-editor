import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, FileItem, EditorSettings, LayoutState, OutputEntry, BottomPanel } from '@/types';
import {
  TERMINAL_DEFAULT_HEIGHT,
  clampTerminalHeight,
  getTerminalMaximizedHeight,
} from '@/utils/terminalGeometry';

const DEFAULT_CPP_CODE = `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`;

function createId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createDefaultFile(): FileItem {
  return {
    id: createId(),
    name: 'main.cpp',
    content: DEFAULT_CPP_CODE,
    language: 'cpp',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

interface AppStore {
  theme: ThemeMode;
  files: FileItem[];
  activeFileId: string;
  editorSettings: EditorSettings;
  layout: LayoutState;
  outputHistory: OutputEntry[];
  stdin: string;
  isRunning: boolean;
  isTerminalResizing: boolean;
  isTransitioning: boolean;
  settingsOpen: boolean;
  commandPaletteOpen: boolean;
  styleSelectorOpen: boolean;
  bootComplete: boolean;

  setTheme: (theme: ThemeMode) => void;
  setIsTransitioning: (v: boolean) => void;
  setBootComplete: (v: boolean) => void;
  setStdin: (v: string) => void;

  createFile: (name: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  updateFileContent: (id: string, content: string) => void;
  setActiveFile: (id: string) => void;
  getActiveFile: () => FileItem | undefined;

  updateEditorSettings: (settings: Partial<EditorSettings>) => void;

  toggleSidebar: () => void;
  toggleExplorer: () => void;
  setExplorerWidth: (w: number) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (h: number) => void;
  maximizeTerminal: () => void;
  collapseTerminal: () => void;
  setBottomPanel: (p: BottomPanel) => void;
  setTerminalResizing: (v: boolean) => void;
  revealTerminalForRun: () => void;
  syncTerminalToViewport: () => void;

  addOutput: (entry: OutputEntry) => void;
  clearOutput: () => void;
  setIsRunning: (v: boolean) => void;
  runCode: () => Promise<void>;

  setSettingsOpen: (v: boolean) => void;
  setCommandPaletteOpen: (v: boolean) => void;
  setStyleSelectorOpen: (v: boolean) => void;
}

const defaultFile = createDefaultFile();

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      theme: 'minimalism',
      files: [defaultFile],
      activeFileId: defaultFile.id,
      editorSettings: {
        fontSize: 14,
        tabSize: 2,
        wordWrap: 'off',
        minimap: true,
        lineNumbers: true,
        autoSave: true,
      },
      layout: {
        sidebarOpen: true,
        explorerOpen: true,
        explorerWidth: 260,
        terminalOpen: true,
        terminalHeight: TERMINAL_DEFAULT_HEIGHT,
        terminalMaximized: false,
        terminalCollapsed: false,
        previousTerminalHeight: TERMINAL_DEFAULT_HEIGHT,
        bottomPanel: 'output' as BottomPanel,
        activeTerminalTab: 'output' as BottomPanel,
      },
      outputHistory: [],
      stdin: '',
      isRunning: false,
      isTerminalResizing: false,
      isTransitioning: false,
      settingsOpen: false,
      commandPaletteOpen: false,
      styleSelectorOpen: false,
      bootComplete: false,

      setTheme: (theme) => set({ theme }),
      setIsTransitioning: (isTransitioning) => set({ isTransitioning }),
      setBootComplete: (bootComplete) => set({ bootComplete }),
      setStdin: (stdin) => set({ stdin }),

      createFile: (name) => {
        const file: FileItem = {
          id: createId(),
          name: name.endsWith('.cpp') ? name : `${name}.cpp`,
          content: '',
          language: 'cpp',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          files: [...s.files, file],
          activeFileId: file.id,
        }));
      },

      deleteFile: (id) => {
        const s = get();
        if (s.files.length <= 1) return;
        const filtered = s.files.filter((f) => f.id !== id);
        set({
          files: filtered,
          activeFileId: s.activeFileId === id ? filtered[0].id : s.activeFileId,
        });
      },

      renameFile: (id, name) => {
        set((s) => ({
          files: s.files.map((f) =>
            f.id === id ? { ...f, name: name.endsWith('.cpp') ? name : `${name}.cpp`, updatedAt: Date.now() } : f
          ),
        }));
      },

      updateFileContent: (id, content) => {
        set((s) => ({
          files: s.files.map((f) =>
            f.id === id ? { ...f, content, updatedAt: Date.now() } : f
          ),
        }));
      },

      setActiveFile: (id) => set({ activeFileId: id }),

      getActiveFile: () => {
        const s = get();
        return s.files.find((f) => f.id === s.activeFileId);
      },

      updateEditorSettings: (settings) => {
        set((s) => ({
          editorSettings: { ...s.editorSettings, ...settings },
        }));
      },

      toggleSidebar: () =>
        set((s) => ({
          layout: { ...s.layout, sidebarOpen: !s.layout.sidebarOpen },
        })),

      toggleExplorer: () =>
        set((s) => ({
          layout: { ...s.layout, explorerOpen: !s.layout.explorerOpen },
        })),

      setExplorerWidth: (explorerWidth) =>
        set((s) => ({
          layout: { ...s.layout, explorerWidth: Math.min(400, Math.max(180, explorerWidth)) },
        })),

      // Toggling the terminal must NEVER reset the user's chosen height.
      // terminalHeight is left untouched so reopening restores the same size.
      toggleTerminal: () =>
        set((s) => ({
          layout: { ...s.layout, terminalOpen: !s.layout.terminalOpen },
        })),

      // Height is clamped against the live viewport (min 180 .. ~90% of
      // workspace) rather than the old hard-coded 500px ceiling.
      // A manual drag also exits the maximized state, like a real IDE.
      setTerminalHeight: (terminalHeight) =>
        set((s) => {
          const clamped = clampTerminalHeight(terminalHeight);
          return {
            layout: {
              ...s.layout,
              terminalHeight: clamped,
              terminalCollapsed: false,
              terminalMaximized: s.isTerminalResizing ? false : s.layout.terminalMaximized,
            },
          };
        }),

      setTerminalResizing: (isTerminalResizing) => set({ isTerminalResizing }),

      setBottomPanel: (bottomPanel) =>
        set((s) => ({
          layout: {
            ...s.layout,
            bottomPanel,
            activeTerminalTab: bottomPanel,
            terminalOpen: true,
            terminalCollapsed: false,
          },
        })),

      // Real toggle: maximize -> 80% of workspace, restore -> previous height.
      // The old version hard-set terminalMaximized:true so it could never
      // return, which made the Restore button a no-op.
      maximizeTerminal: () =>
        set((s) => {
          if (s.layout.terminalMaximized) {
            const restored = clampTerminalHeight(
              s.layout.previousTerminalHeight || TERMINAL_DEFAULT_HEIGHT
            );
            return {
              layout: {
                ...s.layout,
                terminalMaximized: false,
                terminalCollapsed: false,
                terminalHeight: restored,
              },
            };
          }
          return {
            layout: {
              ...s.layout,
              terminalMaximized: true,
              terminalCollapsed: false,
              terminalOpen: true,
              // Remember where to come back to.
              previousTerminalHeight: s.layout.terminalHeight,
              terminalHeight: getTerminalMaximizedHeight(),
            },
          };
        }),

      // Collapse to just the tab bar; expanding restores the prior height.
      collapseTerminal: () =>
        set((s) => {
          if (s.layout.terminalCollapsed) {
            const restored = clampTerminalHeight(
              s.layout.previousTerminalHeight || TERMINAL_DEFAULT_HEIGHT
            );
            return {
              layout: {
                ...s.layout,
                terminalCollapsed: false,
                terminalHeight: restored,
              },
            };
          }
          return {
            layout: {
              ...s.layout,
              terminalCollapsed: true,
              terminalMaximized: false,
              previousTerminalHeight: s.layout.terminalHeight,
            },
          };
        }),

      /**
       * Called by RUN. Makes the output visible without ever resetting a
       * height the user chose: opens the terminal if closed, expands it if
       * collapsed, and switches to the OUTPUT tab. If it is already open at a
       * custom size, the size is preserved.
       */
      revealTerminalForRun: () =>
        set((s) => {
          const wasCollapsed = s.layout.terminalCollapsed;
          const restored = wasCollapsed
            ? clampTerminalHeight(s.layout.previousTerminalHeight || TERMINAL_DEFAULT_HEIGHT)
            : s.layout.terminalHeight;
          return {
            layout: {
              ...s.layout,
              terminalOpen: true,
              terminalCollapsed: false,
              terminalHeight: restored,
              bottomPanel: 'output' as BottomPanel,
              activeTerminalTab: 'output' as BottomPanel,
            },
          };
        }),

      /** Re-clamp after a window resize so the terminal stays within bounds. */
      syncTerminalToViewport: () =>
        set((s) => {
          const target = s.layout.terminalMaximized
            ? getTerminalMaximizedHeight()
            : clampTerminalHeight(s.layout.terminalHeight);
          if (target === s.layout.terminalHeight) return s;
          return { layout: { ...s.layout, terminalHeight: target } };
        }),

      addOutput: (entry) =>
        set((s) => ({
          outputHistory: [...s.outputHistory, entry],
        })),

      clearOutput: () => set({ outputHistory: [] }),
      setIsRunning: (isRunning) => set({ isRunning }),

      /**
       * The single source of truth for RUN. Header, keyboard shortcuts, the
       * command palette and Monaco's Cmd+Enter all call this so the behaviour
       * is identical everywhere.
       *
       * It sends EXACTLY the bytes in the active file — the user's code is
       * never rewritten, "corrected" or pre-validated on its way to g++.
       */
      runCode: async () => {
        const s = get();
        if (s.isRunning) return;

        const file = s.files.find((f) => f.id === s.activeFileId);
        if (!file) return;

        // Show the output without clobbering a height the user picked.
        get().revealTerminalForRun();

        const entryId = createId();
        set({ isRunning: true });
        get().addOutput({
          id: entryId,
          timestamp: Date.now(),
          command: `g++ -std=c++17 -O2 ${file.name} && ./${file.name.replace(/\.cpp$/, '')}`,
          result: null,
          status: 'running',
        });

        // Imported lazily so the store module stays free of fetch concerns.
        const { CppExecutionService } = await import('@/utils/execution');
        const result = await CppExecutionService.execute(file.content, get().stdin);

        set((st) => ({
          isRunning: false,
          outputHistory: st.outputHistory.map((e) =>
            e.id === entryId
              ? { ...e, result, status: result.phase === 'success' ? 'success' : 'error' }
              : e
          ),
        }));
      },

      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setStyleSelectorOpen: (styleSelectorOpen) => set({ styleSelectorOpen }),
    }),
    {
      name: 'codelab-storage',
      partialize: (state) => ({
        theme: state.theme,
        files: state.files,
        activeFileId: state.activeFileId,
        editorSettings: state.editorSettings,
        layout: {
          sidebarOpen: state.layout.sidebarOpen,
          explorerOpen: state.layout.explorerOpen,
          explorerWidth: state.layout.explorerWidth,
          terminalOpen: state.layout.terminalOpen,
          terminalHeight: state.layout.terminalHeight,
          terminalMaximized: state.layout.terminalMaximized,
          terminalCollapsed: state.layout.terminalCollapsed,
          previousTerminalHeight: state.layout.previousTerminalHeight,
          bottomPanel: state.layout.bottomPanel,
          activeTerminalTab: state.layout.activeTerminalTab,
        },
      }),
      /**
       * The persisted height is honoured (a 500px terminal stays 500px across a
       * refresh) but re-clamped against the current viewport, so a height saved
       * on a large monitor cannot overflow a smaller window on the next visit.
       */
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const layout = state.layout;
        if (!layout) return;
        layout.terminalHeight = layout.terminalMaximized
          ? getTerminalMaximizedHeight()
          : clampTerminalHeight(layout.terminalHeight ?? TERMINAL_DEFAULT_HEIGHT);
        layout.previousTerminalHeight = clampTerminalHeight(
          layout.previousTerminalHeight ?? TERMINAL_DEFAULT_HEIGHT
        );
      },
    }
  )
);
