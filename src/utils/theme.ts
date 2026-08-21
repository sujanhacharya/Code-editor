import type { ThemeMode } from '@/types';

export function getThemeLabel(theme: ThemeMode): string {
  switch (theme) {
    case 'minimalism':
      return 'Minimalism';
    case 'maximalism':
      return 'Maximalism';
    case 'brutalism':
      return 'Brutalism';
  }
}

export function getThemeDescription(theme: ThemeMode): string {
  switch (theme) {
    case 'minimalism':
      return 'Clean, calm, focused';
    case 'maximalism':
      return 'Rich, dynamic, immersive';
    case 'brutalism':
      return 'Raw, bold, unapologetic';
  }
}

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
