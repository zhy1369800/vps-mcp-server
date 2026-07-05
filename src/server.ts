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
  handleFileList,
  handleFileDelete,
  handleFileSearch,
  handleSessionStart,
  handleSessionExec,
  handleSessionRead,
  handleSessionStop,
  handleGetSystemInfo,
  handleFetchUrl,
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
      name: 'file_list',
      description: '列出目录内容',
      inputSchema: {
        type: 'object',
        properties: {
          dirpath: { type: 'string', description: '目录路径，默认 /tmp' },
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
          type: { type: 'string', enum: ['name', 'content'], description: '搜索类型：name (文件名) 或 content (文本内容)' },
          recursive: { type: 'boolean', description: '是否递归搜索' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_system_info',
      description: '获取 VPS 系统信息 (CPU, 内存, 磁盘, 运行时间)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'fetch_url',
      description: '从 VPS 发起 HTTP 请求获取远程内容',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '请求 URL' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
          headers: { type: 'object', description: 'HTTP 请求头' },
          body: { type: 'any', description: '请求体' },
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
          sessionId: { type: 'string', description: '自定义会话 ID' },
          command: { type: 'string', description: '启动时执行的命令，默认 bash' },
          cwd: { type: 'string', description: '工作目录' },
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
          maxChars: { type: 'number', description: '最大字符数，默认 20000' },
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
      case 'run_command':
        result = await handleRunCommand(args);
        break;
      case 'run_script':
        result = await handleRunScript(args);
        break;
      case 'file_read':
        result = await handleFileRead(args);
        break;
      case 'file_write':
        result = await handleFileWrite(args);
        break;
      case 'file_list':
        result = await handleFileList(args);
        break;
      case 'file_delete':
        result = await handleFileDelete(args);
        break;
      case 'file_search':
        result = await handleFileSearch(args);
        break;
      case 'get_system_info':
        result = await handleGetSystemInfo();
        break;
      case 'fetch_url':
        result = await handleFetchUrl(args);
        break;
      case 'session_start':
        result = await handleSessionStart(args);
        break;
      case 'session_exec':
        result = await handleSessionExec(args);
        break;
      case 'session_read':
        result = await handleSessionRead(args);
        break;
      case 'session_stop':
        result = await handleSessionStop(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
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
    if (auth !== TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
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