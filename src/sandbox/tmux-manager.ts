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

  static async readSession(sessionId: string): Promise<string> {
    const fullId = this.SESSION_PREFIX + sessionId;
    try {
      const { stdout } = await execAsync(`tmux capture-pane -p -t ${fullId}`);
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
