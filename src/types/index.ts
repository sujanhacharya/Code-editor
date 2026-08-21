export type ThemeMode = 'minimalism' | 'maximalism' | 'brutalism';

export interface FileItem {
  id: string;
  name: string;
  content: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

export interface OutputEntry {
  id: string;
  timestamp: number;
  command: string;
  result: ExecutionResult | null;
  status: 'running' | 'success' | 'error' | 'idle';
}

export type BottomPanel = 'terminal' | 'output' | 'problems';

export interface LayoutState {
  sidebarOpen: boolean;
  explorerOpen: boolean;
  explorerWidth: number;
  terminalOpen: boolean;
  terminalHeight: number;
  terminalMaximized: boolean;
  terminalCollapsed: boolean;
  previousTerminalHeight: number;
  bottomPanel: BottomPanel;
}

export interface AppState {
  theme: ThemeMode;
  files: FileItem[];
  activeFileId: string;
  editorSettings: EditorSettings;
  layout: LayoutState;
  outputHistory: OutputEntry[];
  isRunning: boolean;
  isTransitioning: boolean;
  settingsOpen: boolean;
  commandPaletteOpen: boolean;
  styleSelectorOpen: boolean;
  bootComplete: boolean;
}
