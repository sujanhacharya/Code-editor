import type { ExecutionResult } from '@/types';

const API_BASE = 'http://localhost:3001';

export class CppExecutionService {
  static async execute(code: string, stdin: string = ''): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, stdin }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }

      const data = await response.json();
      const executionTime = performance.now() - startTime;

      return {
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode ?? 1,
        executionTime: data.executionTime || executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes('fetch')) ||
        (error instanceof Error && error.message.includes('Failed to fetch')) ||
        (error instanceof Error && error.message.includes('NetworkError')) ||
        (error instanceof Error && error.message.includes('network'));

      if (isNetworkError) {
        return {
          stdout: '',
          stderr: 'EXECUTION SERVICE UNAVAILABLE\n\nUnable to connect to the local execution server on port 3001.\nStart the backend with: cd backend && node server.js',
          exitCode: 1,
          executionTime,
        };
      }

      return {
        stdout: '',
        stderr: `EXECUTION ERROR\n\n${error instanceof Error ? error.message : 'Unknown error'}`,
        exitCode: 1,
        executionTime,
      };
    }
  }
}
