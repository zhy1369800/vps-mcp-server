# VPS MCP Server 🚀

[English](#english) | [中文说明](#chinese)

<a name="english"></a>
## English Description

An advanced Model Context Protocol (MCP) server designed to turn your VPS into a powerful AI-driven remote workstation. It provides a comprehensive set of tools for command execution, file management, system monitoring, and persistent session handling.

### 🌟 Key Features

- **Command Execution**: Run shell commands and scripts (Python/Node/Bash) in a sandboxed environment.
- **Advanced File Management**: Read, write, patch, search, and visualize directory trees.
- **Persistent Sessions**: Based on `tmux`, allowing AI to handle long-running or interactive tasks.
- **System Monitoring**: Real-time process listing and system resource tracking.
- **Network Capabilities**: Make HTTP requests or download large files directly to the VPS.
- **Flexible Transport**: Supports both `stdio` and `SSE` (HTTP) modes.

### 🛠 Tools Reference

| Tool | Description |
|------|-------------|
| `run_command` | Execute a one-off shell command. |
| `run_script` | Run Python, Bash, or Node.js code blocks. |
| `list_files` | List directory contents or generate a recursive tree. |
| `file_read/write` | Read from or write to files. |
| `file_patch` | Edit specific parts of a file (Token-efficient). |
| `file_search` | Search for files by name or content (grep). |
| `get_system_status` | Get OS info, memory, disk, or process list. |
| `http_request` | Fetch web content or download files to disk. |
| `session_*` | Start, exec, read, or stop persistent `tmux` sessions. |

### 🚀 Quick Start

1. **Clone & Install**:
   ```bash
   git clone https://github.com/zhy1369800/vps-mcp-server.git
   cd vps-mcp-server
   npm install
   ```
2. **Build**:
   ```bash
   npm run build
   ```
3. **Configure**:
   Copy `.env.example` to `.env` and set your `MCP_TOKEN`.
4. **Run** (SSE Mode):
   ```bash
   MODE=sse PORT=8080 npm start
   ```

---

<a name="chinese"></a>
## 中文说明

这是一个先进的 **Model Context Protocol (MCP)** 服务端，旨在将您的 VPS 变成一个强大的 AI 驱动远程工作站。它为 AI Agent 提供了完整的指令执行、文件管理、系统监控和持久化会话处理工具集。

### 🌟 核心特性

- **指令执行**：在沙箱环境中运行 Shell 命令和脚本（Python/Node/Bash）。
- **高级文件管理**：支持读取、写入、增量补丁（Patch）、全文搜索及目录树可视化。
- **持久化会话**：基于 `tmux` 实现，允许 AI 处理耗时较长或需要交互的任务。
- **系统监控**：实时查看进程列表、CPU、内存及磁盘占用情况。
- **网络增强**：直接从 VPS 发起 HTTP 请求或下载大文件到磁盘。
- **双模式支持**：支持 `stdio` 本地调用和 `SSE` (HTTP) 远程调用模式。

### 🛠 工具列表

| 工具名称 | 功能描述 |
|----------|----------|
| `run_command` | 执行一次性 Shell 命令。 |
| `run_script` | 运行 Python、Bash 或 Node.js 代码块。 |
| `list_files` | 列出目录内容或生成递归目录树（支持排除目录）。 |
| `file_read/write` | 读取或写入文件。 |
| `file_patch` | 增量编辑文件特定部分（极度节省 Token）。 |
| `file_search` | 按名称或内容搜索文件（基于 grep）。 |
| `get_system_status` | 获取系统概览、内存、磁盘或进程列表。 |
| `http_request` | 发起 HTTP 请求或下载文件到 VPS 磁盘。 |
| `session_*` | 启动、执行、读取或停止持久化的 `tmux` 会话。 |

### 🚀 快速开始

1. **克隆与安装**：
   ```bash
   git clone https://github.com/zhy1369800/vps-mcp-server.git
   cd vps-mcp-server
   npm install
   ```
2. **编译**：
   ```bash
   npm run build
   ```
3. **配置环境**：
   将 `.env.example` 复制为 `.env` 并设置您的 `MCP_TOKEN`。
4. **启动服务** (SSE 模式)：
   ```bash
   MODE=sse PORT=8080 npm start
   ```

### 🛡 安全建议

建议在 Docker 容器中运行此服务，并配合 Nginx 反向代理（配置 SSL 证书）以确保通信安全。

### 📄 开源协议

MIT
