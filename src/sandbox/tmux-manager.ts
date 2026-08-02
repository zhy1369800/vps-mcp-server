import { execAsync } from '../utils.js';

export class TmuxManager {
  private static readonly SESSION_PREFIX = 'mcp-';

  static async startSession(sessionId: string, command: string, cwd?: string): Promise<void> {
    const fullId = this.SESSION_PREFIX + sessionId;
    const cdCmd = cwd ? `cd ${cwd} &&` : '';
    await execAsync(`tmux new-session -d -s ${fullId} "${cdCmd} ${command}"`);
  }

  static async execInSession(sessionId: string, command: string): Promise<string> {
    const fullId = this.SESSION_PREFIX + sessionId;
    const { stdout } = await execAsync(`tmux send-keys -t ${fullId} "${command}" Enter`);
    return stdout;
  }

  static async readSession(sessionId: string, lines?: number): Promise<string> {
    const fullId = this.SESSION_PREFIX + sessionId;
    try {
      // 若指定了 lines 则按需限制行数，未指定则读取完整屏幕
      const linesArg = lines ? `-S -${lines}` : '';
      const { stdout } = await execAsync(`tmux capture-pane -p ${linesArg} -t ${fullId}`);
      return stdout;
    } catch {
      return '';
    }
  }

  static async stopSession(sessionId: string): Promise<boolean> {
    const fullId = this.SESSION_PREFIX + sessionId;
    try {
      await execAsync(`tmux kill-session -t ${fullId}`);
      return true;
    } catch {
      return false;
    }
  }

  static async sessionExists(sessionId: string): Promise<boolean> {
    const fullId = this.SESSION_PREFIX + sessionId;
    try {
      await execAsync(`tmux has-session -t ${fullId}`);
      return true;
    } catch {
      return false;
    }
  }

  static async listSessions(): Promise<string[]> {
    const { stdout } = await execAsync(`tmux list-sessions -F "#{session_name}"`);
    return stdout.split('\n').filter(s => s.startsWith(this.SESSION_PREFIX)).map(s => s.slice(this.SESSION_PREFIX.length));
  }
}
