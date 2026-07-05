import { executeCommand } from '../sandbox/executor.js';

export async function handleRunCommand(args: any): Promise<any> {
  const { command, cwd, timeout = 30000 } = args;
  if (!command) throw new Error('command is required');

  let output = '';
  const result = await executeCommand(command, {
    cwd: cwd || '/tmp',
    timeout,
    onStdout: (chunk) => { output += chunk; },
    onStderr: (chunk) => { output += chunk; },
  });

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
