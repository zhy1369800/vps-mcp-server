import fs from 'fs/promises';
import path from 'path';
import { executeCommand } from '../sandbox/executor.js';

const RUNNERS: Record<string, string> = {
  python: 'python3',
  bash: 'bash',
  node: 'node',
  sh: 'sh',
};

export async function handleRunScript(args: any): Promise<any> {
  const { language, code, timeout = 30000 } = args;
  if (!language || !code) throw new Error('language and code required');
  const runner = RUNNERS[language];
  if (!runner) throw new Error(`Unsupported language: ${language}`);

  const tmpDir = '/tmp/mcp-scripts';
  await fs.mkdir(tmpDir, { recursive: true });
  const extMap: Record<string, string> = { python: 'py', bash: 'sh', node: 'js', sh: 'sh' };
  const fileName = `script_${Date.now()}.${extMap[language] || 'txt'}`;
  const filePath = path.join(tmpDir, fileName);
  await fs.writeFile(filePath, code, { mode: 0o644 });

  let output = '';
  const result = await executeCommand(`${runner} ${filePath}`, {
    cwd: tmpDir,
    timeout,
    onStdout: (chunk) => { output += chunk; },
    onStderr: (chunk) => { output += chunk; },
  });

  await fs.unlink(filePath).catch(() => {});

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: result.success,
        exitCode: result.exitCode,
        output: output.slice(-20000),
        timedOut: result.timedOut,
        error: result.error,
      }, null, 2),
    }],
  };
}
