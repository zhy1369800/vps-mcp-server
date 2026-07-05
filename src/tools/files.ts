import fs from 'fs/promises';
import path from 'path';

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
