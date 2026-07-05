#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import {
  handleRunCommand,
  handleRunScript,
  handleFileRead,
  handleFileWrite,
  handleListFiles,
  handleFileDelete,
  handleFileSearch,
  handleFilePatch,
  handleSessionStart,
  handleSessionExec,
  handleSessionRead,
  handleSessionStop,
  handleGetSystemStatus,
  handleKillProcess,
  handleHttpRequest,
} from './tools/index.js';

const TOKEN = process.env.MCP_TOKEN || 'change-me';

const server = new Server(
  {
    name: 'vps-sandbox',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'run_command',
      description: '在 VPS 沙盒中执行 Shell 命令（一次性）',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '要执行的命令' },
          cwd: { type: 'string', description: '工作目录，默认 /tmp' },
          timeout: { type: 'number', description: '超时(ms)，默认 30000' },
        },
        required: ['command'],
      },
    },
    {
      name: 'run_script',
      description: '执行脚本代码 (python/bash/node)',
      inputSchema: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['python', 'bash', 'node', 'sh'] },
          code: { type: 'string', description: '脚本源码' },
          timeout: { type: 'number', description: '超时(ms)' },
        },
        required: ['language', 'code'],
      },
    },
    {
      name: 'file_read',
      description: '读取文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: { type: 'string' },
        },
        required: ['filepath'],
      },
    },
    {
      name: 'file_write',
      description: '写入文件',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['filepath', 'content'],
      },
    },
    {
      name: 'file_patch',
      description: '增量编辑文件（搜索并替换）',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: { type: 'string' },
          search: { type: 'string', description: '要搜索的原始文本' },
          replace: { type: 'string', description: '要替换成的新文本' },
        },
        required: ['filepath', 'search', 'replace'],
      },
    },
    {
      name: 'list_files',
      description: '列出目录内容或递归获取目录树',
      inputSchema: {
        type: 'object',
        properties: {
          dirpath: { type: 'string', description: '目录路径' },
          recursive: { type: 'boolean', description: '是否递归列出 (树状结构)' },
          depth: { type: 'number', description: '递归深度' },
          exclude: { type: 'array', items: { type: 'string' }, description: '排除的目录' },
        },
      },
    },
    {
      name: 'file_delete',
      description: '删除文件或目录',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: { type: 'string' },
        },
        required: ['filepath'],
      },
    },
    {
      name: 'file_search',
      description: '搜索文件名或文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          dirpath: { type: 'string', description: '起始目录' },
          query: { type: 'string', description: '搜索关键词' },
          type: { type: 'string', enum: ['name', 'content'], description: '搜索类型' },
          recursive: { type: 'boolean', description: '是否递归搜索' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_system_status',
      description: '获取 VPS 系统状态或进程列表',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['summary', 'processes'], description: 'summary: 系统概览, processes: 进程列表' },
          sort: { type: 'string', enum: ['cpu', 'mem'], description: '进程排序方式' },
        },
      },
    },
    {
      name: 'kill_process',
      description: '终止指定 PID 的进程',
      inputSchema: {
        type: 'object',
        properties: {
          pid: { type: 'number' },
          force: { type: 'boolean' },
        },
        required: ['pid'],
      },
    },
    {
      name: 'http_request',
      description: '发起 HTTP 请求或下载文件',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
          headers: { type: 'object' },
          body: { type: 'any' },
          savePath: { type: 'string', description: '如果提供，则将响应保存到此文件路径' },
        },
        required: ['url'],
      },
    },
    {
      name: 'session_start',
      description: '启动一个持久 tmux 会话',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          command: { type: 'string' },
          cwd: { type: 'string' },
        },
        required: ['sessionId'],
      },
    },
    {
      name: 'session_exec',
      description: '向已有会话发送命令',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          command: { type: 'string' },
        },
        required: ['sessionId', 'command'],
      },
    },
    {
      name: 'session_read',
      description: '读取会话的最近输出',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          maxChars: { type: 'number' },
        },
        required: ['sessionId'],
      },
    },
    {
      name: 'session_stop',
      description: '停止并销毁会话',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
        },
        required: ['sessionId'],
      },
    },
  ],
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    switch (name) {
      case 'run_command': result = await handleRunCommand(args); break;
      case 'run_script': result = await handleRunScript(args); break;
      case 'file_read': result = await handleFileRead(args); break;
      case 'file_write': result = await handleFileWrite(args); break;
      case 'file_patch': result = await handleFilePatch(args); break;
      case 'list_files': result = await handleListFiles(args); break;
      case 'file_delete': result = await handleFileDelete(args); break;
      case 'file_search': result = await handleFileSearch(args); break;
      case 'get_system_status': result = await handleGetSystemStatus(args); break;
      case 'kill_process': result = await handleKillProcess(args); break;
      case 'http_request': result = await handleHttpRequest(args); break;
      case 'session_start': result = await handleSessionStart(args); break;
      case 'session_exec': result = await handleSessionExec(args); break;
      case 'session_read': result = await handleSessionRead(args); break;
      case 'session_stop': result = await handleSessionStop(args); break;
      default: throw new Error(`Unknown tool: ${name}`);
    }
    return result;
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

const mode = process.env.MODE || 'stdio';

if (mode === 'sse') {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    const auth = req.headers.authorization?.replace('Bearer ', '');
    if (auth !== TOKEN) return res.status(401).json({ error: 'Unauthorized' });
    next();
  });
  const transport = new SSEServerTransport('/messages', app);
  server.connect(transport);
  app.listen(process.env.PORT || 8080, () => {
    console.error(`MCP SSE server running on port ${process.env.PORT || 8080}`);
  });
} else {
  const transport = new StdioServerTransport();
  server.connect(transport);
  console.error('MCP stdio server running');
}
