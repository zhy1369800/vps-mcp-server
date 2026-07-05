import { executeCommand } from '../sandbox/executor.js';

export async function handleFetchUrl(args: any): Promise<any> {
  const { url, method = 'GET', body, headers = {} } = args;
  if (!url) throw new Error('url required');

  let command = `curl -sL -X ${method} "${url}"`;
  
  // Add headers
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