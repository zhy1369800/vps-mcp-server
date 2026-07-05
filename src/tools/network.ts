import { executeCommand } from '../sandbox/executor.js';
import path from 'path';
import fs from 'fs/promises';

export async function handleHttpRequest(args: any): Promise<any> {
  const { url, method = 'GET', body, headers = {}, savePath } = args;
  if (!url) throw new Error('url required');

  let command = `curl -sL -X ${method} "${url}"`;
  
  if (savePath) {
    const dir = path.dirname(savePath);
    await fs.mkdir(dir, { recursive: true });
    command = `curl -L -o "${savePath}" "${url}"`;
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      command += ` -H "${key}: ${value}"`;
    });

    if (body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      command += ` -d '${bodyStr.replace(/'/g, "'\\''")}'`;
      if (!headers['Content-Type']) {
        command += ` -H "Content-Type: application/json"`;
      }
    }
  }

  const result = await executeCommand(command, { timeout: savePath ? 60000 : 20000 });
  
  if (savePath) {
    if (result.success) {
      return { content: [{ type: 'text', text: `Successfully downloaded to ${savePath}` }] };
    } else {
      throw new Error(`Download failed: ${result.stderr || result.error}`);
    }
  }

  const output = result.stdout || result.stderr || (result.success ? '(empty response)' : 'Request failed');
  return {
    content: [{
      type: 'text',
      text: output.slice(0, 30000)
    }]
  };
}
