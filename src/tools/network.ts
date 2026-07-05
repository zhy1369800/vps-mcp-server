import { executeCommand } from '../sandbox/executor.js';
import path from 'path';
import fs from 'fs/promises';

export async function handleFetchUrl(args: any): Promise<any> {
  const { url, method = 'GET', body, headers = {} } = args;
  if (!url) throw new Error('url required');

  let command = `curl -sL -X ${method} "${url}"`;
  
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

  const result = await executeCommand(command, { timeout: 20000 });
  const output = result.stdout || result.stderr || (result.success ? '(empty response)' : 'Fetch failed');

  return {
    content: [{
      type: 'text',
      text: output.slice(0, 30000)
    }]
  };
}

export async function handleDownloadFile(args: any): Promise<any> {
  const { url, savePath } = args;
  if (!url || !savePath) throw new Error('url and savePath required');

  const dir = path.dirname(savePath);
  await fs.mkdir(dir, { recursive: true });

  const command = `curl -L -o "${savePath}" "${url}"`;
  const result = await executeCommand(command, { timeout: 60000 });

  if (result.success) {
    return { content: [{ type: 'text', text: `Successfully downloaded to ${savePath}` }] };
  } else {
    throw new Error(`Download failed: ${result.stderr || result.error}`);
  }
}
