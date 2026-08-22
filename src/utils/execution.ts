import type { ExecutionResult, ExecutionPhase } from '@/types';

const API_BASE = 'http://localhost:3001';

/** Give up on the request a little after the backend's own 10s compile/run cap. */
const REQUEST_TIMEOUT_MS = 20000;

function isPhase(v: unknown): v is ExecutionPhase {
  return (
    v === 'success' ||
    v === 'compile_error' ||
    v === 'runtime_error' ||
    v === 'timeout' ||
    v === 'network_error'
  );
}

export class CppExecutionService {
  static async execute(code: string, stdin: string = ''): Promise<ExecutionResult> {
    const startTime = performance.now();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, stdin }),
        signal: controller.signal,
      });

      // A non-2xx response is a transport/server fault, not a compiler result.
      if (!response.ok) {
        return {
          stdout: '',
          stderr:
            `EXECUTION SERVICE ERROR\n\nThe backend responded with HTTP ${response.status} ${response.statusText}.\n` +
            `Check the server log for 'cd backend && node server.js'.`,
          exitCode: 1,
          executionTime: performance.now() - startTime,
          phase: 'network_error',
        };
      }

      const data = await response.json();
      const executionTime = performance.now() - startTime;

      const stdout = typeof data.stdout === 'string' ? data.stdout : '';
      const stderr = typeof data.stderr === 'string' ? data.stderr : '';
      const exitCode = typeof data.exitCode === 'number' ? data.exitCode : 1;

      // Trust the backend's phase when present; otherwise infer it. Crucially,
      // anything that reached this point is a REAL program result, so it is
      // never reported as a network error.
      const phase: ExecutionPhase = isPhase(data.phase)
        ? data.phase
        : exitCode === 0
        ? 'success'
        : 'runtime_error';

      return {
        stdout,
        stderr,
        exitCode,
        executionTime: typeof data.executionTime === 'number' ? data.executionTime : executionTime,
        phase,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      // Our own client-side abort.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          stdout: '',
          stderr: `TIMEOUT\n\nNo response from the execution service after ${Math.round(
            REQUEST_TIMEOUT_MS / 1000
          )}s. The program may be stuck in an infinite loop.`,
          exitCode: 124,
          executionTime,
          phase: 'timeout',
        };
      }

      // fetch() only rejects for genuine transport failures, so this really is
      // a network problem (backend not running, CORS, DNS, offline).
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        stdout: '',
        stderr:
          'EXECUTION SERVICE UNAVAILABLE\n\n' +
          'Unable to reach the local execution server on port 3001.\n' +
          'Start the backend with: cd backend && node server.js\n\n' +
          `Details: ${message}`,
        exitCode: 1,
        executionTime,
        phase: 'network_error',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
