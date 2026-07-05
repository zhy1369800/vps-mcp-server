import fs from 'fs/promises';
import path from 'path';
import { executeCommand } from '../sandbox/executor.js';

export async function handleFileRead(args: any): Promise<any> {
  const { filepath } = args;
  if (!filepath) throw new Error('filepath required');
  const content = await fs.readFile(filepath, 'utf-8');
  return { content: [{
    type: 'text',
    text: content
  }] };
}

export async function handleFileWrite(args: any): Promise<any> {
  const { filepath, content } = args;
  if (!filepath) throw new Error('filepath required');
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, content);
  return { content: [{
    type: 'text',
    text: `Written to ${filepath}`
  }] };
}

export async function handleFileList(args: any): Promise<any> {
  const { dirpath = '/tmp' } = args;
  const entries = await fs.readdir(dirpath, { withFileTypes: true });
  const list = entries.map(e => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`).join('\n');
  return { content: [{
    type: 'text',
    text: list || '(empty)'
  }] };
}

export async function handleFileDelete(args: any): Promise<any> {
  const { filepath } = args;
  if (!filepath) throw new Error('filepath required');
  await fs.rm(filepath, { recursive: true, force: true });
  return { content: [{
    type: 'text',
    text: `Deleted ${filepath}`
  }] };
}

export async function handleFileSearch(args: any): Promise<any> {
  const { dirpath = '.', query, type = 'name', recursive = true } = args;
  if (!query) throw new Error('query required');

  let command = '';
  if (type === 'name') {
    command = `find ${dirpath} ${recursive ? '' : '-maxdepth 1'} -name "*${query}*"`;
  } else {
    command = `grep -rnE "${query}" ${dirpath} ${recursive ? '' : '--maxdepth=0'}`;
  }

  const result = await executeCommand(command, { timeout: 15000 });
  const output = result.stdout || result.stderr || (result.success ? '(no matches)' : 'Search failed');

  return {
    content: [{
      type: 'text',
      text: output.slice(0, 20000)
    }]
  };
}