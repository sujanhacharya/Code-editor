/**
 * Downloading the current C++ source.
 *
 * One implementation, used by the header button and the command palette, so the
 * behaviour can never drift between entry points.
 *
 * Everything here is browser-side: no request is made, the backend is not
 * involved, and the text is written out byte-for-byte as the user typed it —
 * including code that does not compile.
 */

import { useAppStore } from '@/store';
import { getLiveEditorValue } from '@/utils/editorBridge';
import { showToast } from '@/utils/toast';

/**
 * Extensions we treat as "already a C/C++ source name", so `main.cpp` is never
 * turned into `main.cpp.cpp`.
 */
const CPP_EXTENSIONS = [
  '.cpp', '.cc', '.cxx', '.c++', '.cp', '.c',
  '.hpp', '.hh', '.hxx', '.h', '.h++',
];

/** `main` -> `main.cpp`; `main.cpp` -> `main.cpp`; empty -> `main.cpp`. */
export function toCppFileName(rawName: string | null | undefined): string {
  // Trailing dots would otherwise produce "main..cpp".
  const name = (rawName ?? '').trim().replace(/\.+$/, '');
  if (!name) return 'main.cpp';

  const lower = name.toLowerCase();
  if (CPP_EXTENSIONS.some((ext) => lower.endsWith(ext))) return name;

  return `${name}.cpp`;
}

/**
 * Writes `contents` to the user's downloads as `fileName`.
 *
 * A Blob built from a JS string is always encoded as UTF-8, so multi-byte
 * literals (e.g. "Hello 世界") reach the disk intact regardless of the MIME type.
 *
 * The type is deliberately octet-stream rather than something like `text/plain`
 * or `text/x-c++src`: when a browser recognises the MIME type it may append its
 * own preferred extension, which is how "main.cpp" ends up saved as
 * "main.cpp.txt". octet-stream has no preferred extension, so the name we ask
 * for is the name the user gets.
 */
export function downloadTextFile(fileName: string, contents: string): void {
  const blob = new Blob([contents], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Chromium and Firefox begin the transfer synchronously inside click(), but
  // Safari's is asynchronous — revoking on the next tick there produces an
  // empty or aborted download. A few seconds costs nothing (the blob is a few
  // KB of source) and is safe everywhere.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * The exact text to write out, plus the name to write it under.
 *
 * The live Monaco model wins over the stored copy: what the user is looking at
 * is what gets downloaded, even if an edit has not yet reached the store.
 * Returns null when there is no active file, so callers can disable their UI
 * instead of failing.
 */
export function getActiveSourceForDownload(): { name: string; content: string } | null {
  const state = useAppStore.getState();
  const file = state.files.find((f) => f.id === state.activeFileId);
  if (!file) return null;

  const live = getLiveEditorValue(file.id);

  return {
    name: toCppFileName(file.name),
    content: typeof live === 'string' ? live : file.content,
  };
}

/**
 * Downloads the active file and shows a toast. Returns the file name written,
 * or null if there was no active file (nothing happens in that case).
 *
 * Read-only with respect to editor state: no file, cursor, selection, scroll
 * position or content is touched.
 */
export function downloadActiveCppFile(): string | null {
  const source = getActiveSourceForDownload();
  if (!source) return null;

  downloadTextFile(source.name, source.content);
  showToast(`✓ Downloaded ${source.name}`);
  return source.name;
}
