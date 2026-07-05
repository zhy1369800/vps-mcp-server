import { spawn } from 'child_process';
import { DEFAULT_TIMEOUT, MAX_BUFFER } from '../utils.js';

export interface ExecResult {
  success: boolean;
  timedOut: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

export function executeCommand(
  command: string,
  options?: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    onStdout?: (chunk: string) => void;
    onStderr?: (chunk: string) => void;
  }
): Promise<ExecResult> {
  return new Promise((resolve) => {
    const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT;
    const cwd = options?.cwd ?? process.cwd();
    const env = { ...process.env, ...options?.env };

    const child = spawn('sh', ['-c', command], {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      detached: false,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      if (stdout.length > MAX_BUFFER) stdout = stdout.slice(-MAX_BUFFER);
      options?.onStdout?.(chunk);
    });

    child.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      if (stderr.length > MAX_BUFFER) stderr = stderr.slice(-MAX_BUFFER);
      options?.onStderr?.(chunk);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0 && !timedOut,
        timedOut,
        exitCode: code,
        stdout,
        stderr,
        error: timedOut ? 'Command timed out' : code !== 0 ? `Exit code ${code}` : undefined,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        timedOut: false,
        exitCode: null,
        stdout,
        stderr,
        error: err.message,
      });
    });
  });
}
