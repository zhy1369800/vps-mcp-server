import { executeCommand } from '../sandbox/executor.js';

export async function handleGetSystemInfo(): Promise<any> {
  const command = 'echo "OS Info:"; uname -a; echo "\nUptime:"; uptime; echo "\nMemory Usage:"; free -h; echo "\nDisk Usage:"; df -h /';
  const result = await executeCommand(command);
  return {
    content: [{
      type: 'text',
      text: result.stdout || result.stderr
    }]
  };
}