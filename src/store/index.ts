import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, FileItem, EditorSettings, LayoutState, OutputEntry, BottomPanel } from '@/types';

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

  addOutput: (entry: OutputEntry) => void;
  clearOutput: () => void;
  setIsRunning: (v: boolean) => void;

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
        terminalHeight: 220,
        bottomPanel: 'output' as BottomPanel,
      },
      outputHistory: [],
      stdin: '',
      isRunning: false,
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

      toggleTerminal: () =>
        set((s) => ({
          layout: { ...s.layout, terminalOpen: !s.layout.terminalOpen },
        })),

      setTerminalHeight: (terminalHeight) =>
        set((s) => ({
          layout: { ...s.layout, terminalHeight: Math.min(500, Math.max(100, terminalHeight)) },
        })),

      setBottomPanel: (bottomPanel) =>
        set((s) => ({
          layout: { ...s.layout, bottomPanel, terminalOpen: true },
        })),

      addOutput: (entry) =>
        set((s) => ({
          outputHistory: [...s.outputHistory, entry],
        })),

      clearOutput: () => set({ outputHistory: [] }),
      setIsRunning: (isRunning) => set({ isRunning }),

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
          bottomPanel: state.layout.bottomPanel,
        },
      }),
    }
  )
);
