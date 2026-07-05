import { executeCommand } from '../sandbox/executor.js';

export async function handleGetSystemStatus(args: any): Promise<any> {
  const { type = 'summary', sort = 'cpu' } = args;

  if (type === 'summary') {
    const command = 'echo "OS Info:"; uname -a; echo "\nUptime:"; uptime; echo "\nMemory Usage:"; free -h; echo "\nDisk Usage:"; df -h /';
    const result = await executeCommand(command);
    return {
      content: [{ type: 'text', text: result.stdout || result.stderr }]
    };
  } else {
    let command = 'ps aux --sort=-%cpu | head -n 31';
    if (sort === 'mem') {
      command = 'ps aux --sort=-%mem | head -n 31';
    }
    const result = await executeCommand(command);
    return {
      content: [{ type: 'text', text: result.stdout || result.stderr }]
    };
  }
}

export async function handleKillProcess(args: any): Promise<any> {
  const { pid, force = false } = args;
  if (!pid) throw new Error('pid required');

  const command = `kill ${force ? '-9' : ''} ${pid}`;
  const result = await executeCommand(command);

  if (result.success) {
    return { content: [{ type: 'text', text: `Successfully sent kill signal to process ${pid}` }] };
  } else {
    throw new Error(`Failed to kill process: ${result.stderr || result.error}`);
  }
}
