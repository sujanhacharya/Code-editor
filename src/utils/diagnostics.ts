import type { CompilerDiagnostic } from '@/types';

/**
 * Parses raw g++/clang++ stderr into structured diagnostics for the
 * PROBLEMS tab.
 *
 * Handles the standard GNU/Clang diagnostic format:
 *   /tmp/codelab-xxx/main.cpp:5:5: error: use of undeclared identifier 'cin'
 *
 * The absolute temp path is collapsed to just the basename ("main.cpp") so the
 * user sees a stable, meaningful filename instead of a throwaway temp dir.
 *
 * Note: this only *reads* compiler output. It never rewrites user source.
 */

// file:line:col: severity: message
const DIAG_RE = /^(.*?):(\d+):(\d+):\s*(fatal error|error|warning|note):\s*(.*)$/;

// Some diagnostics (e.g. linker errors) have no line/col.
const FILE_ONLY_RE = /^(.*?):\s*(fatal error|error|warning):\s*(.*)$/;

function basename(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

function normalizeSeverity(raw: string): CompilerDiagnostic['severity'] {
  if (raw === 'fatal error' || raw === 'error') return 'error';
  if (raw === 'warning') return 'warning';
  return 'note';
}

/**
 * The backend always compiles the submitted source as `main.cpp`, so that is
 * the only file the editor can meaningfully navigate to.
 */
const COMPILED_SOURCE = 'main.cpp';

export function parseCompilerDiagnostics(
  stderr: string,
  sourceFile: string = COMPILED_SOURCE
): CompilerDiagnostic[] {
  if (!stderr) return [];

  const out: CompilerDiagnostic[] = [];
  const seen = new Set<string>();

  for (const rawLine of stderr.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    // Skip the source-echo / caret lines g++ emits, e.g. "    1 | #inlcude" and "      |  ^"
    if (/^\s*\d+\s*\|/.test(line)) continue;
    if (/^\s*\|\s*\^?~*\s*$/.test(line)) continue;
    if (/^\s*\|/.test(line)) continue;

    const push = (diag: CompilerDiagnostic) => {
      // Diagnostics inside system headers (<iostream>, <vector>, ...) refer to
      // lines the user cannot see. Clicking one would jump the editor to an
      // unrelated line in their own file, so they are left out of PROBLEMS.
      // The complete, unedited compiler output is still shown in OUTPUT.
      if (diag.file !== sourceFile) return;
      const key = `${diag.file}:${diag.line}:${diag.column}:${diag.severity}:${diag.message}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(diag);
    };

    let m = DIAG_RE.exec(line);
    if (m) {
      push({
        file: basename(m[1]),
        line: parseInt(m[2], 10),
        column: parseInt(m[3], 10),
        severity: normalizeSeverity(m[4]),
        message: m[5].trim(),
      });
      continue;
    }

    m = FILE_ONLY_RE.exec(line);
    if (m && !/^\s/.test(rawLine)) {
      // Avoid matching summary lines like "1 warning and 5 errors generated."
      if (/^\d+\s+(warning|error)/.test(line)) continue;
      push({
        file: basename(m[1]),
        line: 1,
        column: 1,
        severity: normalizeSeverity(m[2]),
        message: m[3].trim(),
      });
    }
  }

  return out;
}

/** Count only real errors. */
export function countErrors(diags: CompilerDiagnostic[]): number {
  return diags.filter((d) => d.severity === 'error').length;
}

/**
 * The number shown on the PROBLEMS badge: errors and warnings, but not the
 * explanatory "note:" lines that hang off them.
 */
export function countProblems(diags: CompilerDiagnostic[]): number {
  return diags.filter((d) => d.severity === 'error' || d.severity === 'warning').length;
}
