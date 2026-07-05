import { exec } from 'child_process';
import { promisify } from 'util';

export const execAsync = promisify(exec);
export const DEFAULT_TIMEOUT = 30000;
export const MAX_BUFFER = 10 * 1024 * 1024;

export function quoteShell(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

export function truncateOutput(output: string, maxLen = 20000): string {
  if (output.length <= maxLen) return output;
  return output.slice(0, maxLen) + '\n... [truncated]';
}

export function safeJsonStringify(obj: any): string {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}
