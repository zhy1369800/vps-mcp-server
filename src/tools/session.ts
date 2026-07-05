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

export async function handleSessionStop(args: any): Promise<any> {
  const { sessionId } = args;
  if (!sessionId) throw new Error('sessionId required');
  await TmuxManager.stopSession(sessionId);
  return { content: [{
    type: 'text',
    text: `Session ${sessionId} stopped`
  }] };
}
