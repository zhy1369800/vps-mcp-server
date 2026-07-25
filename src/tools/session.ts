import { TmuxManager } from '../sandbox/tmux-manager.js';

export async function handleSessionStart(args: any): Promise<any> {
  const { sessionId, command, cwd } = args;
  if (!sessionId) throw new Error('sessionId required');
  const exists = await TmuxManager.sessionExists(sessionId);
  if (exists) {
    return { content: [{
      type: 'text',
      text: `Session ${sessionId} already exists`
    }] };
  }
  await TmuxManager.startSession(sessionId, command || 'bash', cwd);
  return { content: [{
    type: 'text',
    text: `Session ${sessionId} started`
  }] };
}

export async function handleSessionExec(args: any): Promise<any> {
  const { sessionId, command } = args;
  if (!sessionId || !command) throw new Error('sessionId and command required');
  const exists = await TmuxManager.sessionExists(sessionId);
  if (!exists) throw new Error(`Session ${sessionId} not found`);
  await TmuxManager.execInSession(sessionId, command);
  return { content: [{
    type: 'text',
    text: `Command sent to session ${sessionId}`
  }] };
}

export async function handleSessionRead(args: any): Promise<any> {
  const { sessionId, maxChars = 20000 } = args;
  if (!sessionId) throw new Error('sessionId required');
  const transcript = await TmuxManager.readSession(sessionId);
  const truncated = transcript.length > maxChars ? transcript.slice(-maxChars) : transcript;
  return { content: [{
    type: 'text',
    text: truncated
  }] };
}

import fs from 'fs/promises';
import { executeCommand } from '../sandbox/executor.js';

const TMP_DIR = process.platform === 'win32' ? 'd:/vps-mcp-server/tmp' : '/tmp';

export async function handleSessionStop(args: any): Promise<any> {
  const { sessionId } = args;
  if (!sessionId) throw new Error('sessionId required');

  // 1. 获取 TTY 隔离键以删除关联的 agy 缓存临时文件
  let ttyId = `tmux_${sessionId}`;
  try {
    const ttyCheck = await executeCommand(`tmux display-message -p -t mcp-${sessionId} '#{pane_tty}'`);
    if (ttyCheck.success && ttyCheck.stdout && ttyCheck.stdout.trim()) {
      ttyId = ttyCheck.stdout.trim().replace(/^\/dev\//, '').replace(/\//g, '_');
    }
  } catch {
    // 保持专属 sessionId 兜底
  }

  // 删除 TTY 关联和兜底命名的缓存与日志
  const filesToRemove = [
    `${TMP_DIR}/agy_sid_${ttyId}.env`,
    `${TMP_DIR}/agy_conv_${ttyId}.log`,
    `${TMP_DIR}/agy_sid_tmux_${sessionId}.env`,
    `${TMP_DIR}/agy_conv_tmux_${sessionId}.log`
  ];

  for (const file of filesToRemove) {
    await fs.rm(file, { force: true }).catch(() => {});
  }

  // 2. 停止 tmux 会话
  await TmuxManager.stopSession(sessionId);
  return { content: [{
    type: 'text',
    text: `Session ${sessionId} stopped and associated temporary context files cleaned up.`
  }] };
}
