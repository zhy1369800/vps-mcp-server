import { executeCommand } from '../sandbox/executor.js';
import { TmuxManager } from '../sandbox/tmux-manager.js';
import { quoteShell } from '../utils.js';
import fs from 'fs/promises';
import path from 'path';

// 跨平台临时目录规范
const TMP_DIR = process.platform === 'win32' ? 'd:/vps-mcp-server/tmp' : '/tmp';

// 平台无关的工具存在性检查方法
async function checkCommand(cmd: string): Promise<boolean> {
  try {
    const check = await executeCommand(`command -v ${cmd} || which ${cmd} || where ${cmd}`);
    return check.success;
  } catch {
    return false;
  }
}

export async function handleAgyAsk(args: any): Promise<any> {
  const {
    prompt,
    sessionId,
    clear = true,
    dangerouslySkipPermissions = true,
    model,
    agent,
    effort,
    mode,
    project,
    addDir,
  } = args;

  if (!prompt) {
    throw new Error('prompt required');
  }

  // 确保临时目录存在
  await fs.mkdir(TMP_DIR, { recursive: true }).catch(() => {});

  // 1. 检查是否存在 agy 命令
  const hasAgy = await checkCommand('agy');
  if (!hasAgy) {
    return {
      content: [{
        type: 'text',
        text: '❌ 系统中未检测到 agy 命令行工具，请确保 Antigravity 运行环境已在远程沙盒中正确配置。'
      }]
    };
  }

  // 2. 检查会话是否存在（如果传了 sessionId）
  if (sessionId) {
    const hasTmux = await checkCommand('tmux');
    if (!hasTmux) {
      return {
        content: [{
          type: 'text',
          text: '❌ 系统未安装 tmux，无法在会话中执行。'
        }]
      };
    }
    const sessionExists = await TmuxManager.sessionExists(sessionId);
    if (!sessionExists) {
      return {
        content: [{
          type: 'text',
          text: `❌ 找不到指定的 tmux 会话 sessionId: ${sessionId}。请先使用 session_start 启动该会话。`
        }]
      };
    }
  }

  // 3. 构造参数串
  const extraArgs: string[] = [];
  if (model) extraArgs.push(`--model ${quoteShell(model)}`);
  if (agent) extraArgs.push(`--agent ${quoteShell(agent)}`);
  if (effort) extraArgs.push(`--effort ${quoteShell(effort)}`);
  if (mode) extraArgs.push(`--mode ${quoteShell(mode)}`);
  if (project) extraArgs.push(`--project ${quoteShell(project)}`);
  if (addDir) extraArgs.push(`--add-dir ${quoteShell(addDir)}`);
  if (dangerouslySkipPermissions) extraArgs.push('--dangerously-skip-permissions');

  // 4. 分情况执行
  if (sessionId) {
    // 【场景 A：传了 sessionId，需要实现上下文持续】
    
    // 获取 TTY 隔离键
    let ttyId = 'default';
    try {
      const ttyCheck = await executeCommand(`tmux display-message -p -t mcp-${sessionId} '#{pane_tty}'`);
      if (ttyCheck.success && ttyCheck.stdout) {
        ttyId = ttyCheck.stdout.trim().replace(/^\/dev\//, '').replace(/\//g, '_');
      }
    } catch {
      ttyId = `tmux_${sessionId}`;
    }

    const logFile = `${TMP_DIR}/agy_conv_${ttyId}.log`;
    const sidStore = `${TMP_DIR}/agy_sid_${ttyId}.env`;

    // 读入已有的 agy_sid
    let agySid: string | null = null;
    try {
      const storeContent = await fs.readFile(sidStore, 'utf-8');
      const match = storeContent.match(/export agy_sid='([a-zA-Z0-9-]+)'/);
      if (match) {
        agySid = match[1];
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to read sidStore (${sidStore}):`, err.message);
      }
    }

    if (agySid) {
      extraArgs.push(`--conversation ${agySid}`);
    } else {
      // 首次提问，强清除潜在的同名脏数据，避免污染
      await fs.rm(sidStore, { force: true }).catch(() => {});
      await fs.rm(logFile, { force: true }).catch(() => {});
      extraArgs.push(`--log-file ${quoteShell(logFile)}`);
    }

    const argsStr = extraArgs.join(' ');
    const markerId = Math.random().toString(36).slice(2, 8);

    // 构造组合命令
    let runCmd = '';
    if (clear) {
      runCmd += 'clear; ';
    }
    // 在 tmux 中执行
    runCmd += `echo "===AGY_START_${markerId}==="; agy -p ${quoteShell(prompt)} ${argsStr}; echo "===AGY_DONE_${markerId}==="`;
    
    await TmuxManager.execInSession(sessionId, runCmd);

    // 轮询等待结束
    let output = '';
    const startTimeout = Date.now();
    const timeoutLimit = 180000; // 3分钟超时
    let isDone = false;

    while (Date.now() - startTimeout < timeoutLimit) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const screen = await TmuxManager.readSession(sessionId);
      if (screen.includes(`===AGY_DONE_${markerId}===`)) {
        // 截取 Marker 之间的部分
        const startIdx = screen.indexOf(`===AGY_START_${markerId}===`);
        const endIdx = screen.indexOf(`===AGY_DONE_${markerId}===`);
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          output = screen.substring(startIdx + `===AGY_START_${markerId}===`.length, endIdx).trim();
          isDone = true;
          break;
        }
      }
    }

    if (!isDone) {
      // 超时兜底读取当前会话内容
      const screen = await TmuxManager.readSession(sessionId);
      const startIdx = screen.indexOf(`===AGY_START_${markerId}===`);
      if (startIdx !== -1) {
        output = screen.substring(startIdx + `===AGY_START_${markerId}===`.length).trim();
      } else {
        output = screen;
      }
      output += '\n\n⚠️ [警告] 会话执行可能超时（超过 180 秒）。';
    }

    // 首次提问，从日志中提取并覆盖写入新分配的会话 ID
    if (!agySid) {
      try {
        const logContent = await fs.readFile(logFile, 'utf-8');
        const sidMatch = logContent.match(/Created conversation ([a-zA-Z0-9-]+)/);
        if (sidMatch) {
          const newSid = sidMatch[1];
          await fs.writeFile(sidStore, `export agy_sid='${newSid}'`, 'utf-8');
        }
      } catch (err) {
        console.error('Failed to parse newly created conversation ID:', err);
      }
    }

    return {
      content: [{ type: 'text', text: output }]
    };

  } else {
    // 【场景 B：未传 sessionId，一次性命令执行，不做任何状态记录】
    const argsStr = extraArgs.join(' ');
    const command = `bash -c "agy -p ${quoteShell(prompt)} ${argsStr}"`;
    const result = await executeCommand(command, { timeout: 120000 });
    const output = result.stdout || result.stderr || (result.success ? '(无输出)' : '执行失败');
    
    return {
      content: [{ type: 'text', text: output }],
      isError: !result.success
    };
  }
}
