# VPS MCP Server

MCP Server for VPS sandbox execution — run commands, scripts, and manage persistent sessions remotely via MCP protocol.

## Features

- **Run Commands** — Execute shell commands with timeout and live output streaming
- **Run Scripts** — Execute Python, Bash, Node.js, and sh scripts
- **File Operations** — Read, write, list, delete files
- **Persistent Sessions** — tmux-based sessions with cwd preservation
- **SSE & stdio Support** — Works with both transports (local or remote)
- **Token Authentication** — Secure bearer token

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run (stdio mode — local only, no network needed)
MCP_TOKEN=your-token npm start

# Run (SSE mode — HTTP server, local or remote)
MODE=sse PORT=8080 MCP_TOKEN=your-token npm start
```

## Transport Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `stdio` | Subprocess stdin/stdout communication | Local clients (Claude Desktop, Cursor, Cline) — no network needed |
| `sse` | HTTP Server-Sent Events | Local testing, web apps, or remote VPS deployment |

To switch modes, set `MODE=stdio` or `MODE=sse` in `.env`.

## Local Usage (stdio)

In Claude Desktop or other MCP clients, add to your config:

```json
{
  "mcpServers": {
    "vps-sandbox": {
      "command": "node",
      "args": ["/path/to/vps-mcp-server/dist/server.js"],
      "env": {
        "MCP_TOKEN": "your-local-token"
      }
    }
  }
}
```

No network ports required — the client spawns the server as a child process.

## Remote Deployment on VPS

```bash
# Install Node.js 22+ and tmux
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git tmux

# Clone and setup
git clone https://github.com/zhy1369800/vps-mcp-server.git
cd vps-mcp-server
npm install
npm run build

# Configure
echo "MCP_TOKEN=your-secure-token" > .env
echo "MODE=sse" >> .env
echo "PORT=8080" >> .env

# Run with PM2
npm install -g pm2
pm2 start dist/server.js --name mcp-server
pm2 save
pm2 startup

# Allow firewall (if applicable)
sudo ufw allow 8080/tcp
```

## OpenOmniBot Configuration

```json
{
  "id": "vps-sandbox",
  "name": "My VPS Sandbox",
  "endpointUrl": "http://<vps-ip>:8080/sse",
  "bearerToken": "your-secure-token"
}
```

For local SSE testing: `endpointUrl: "http://localhost:8080/sse"`

## Tools

| Tool | Description |
|------|-------------|
| `run_command` | Execute a shell command (one-shot) |
| `run_script` | Execute a script (python/bash/node/sh) |
| `file_read` | Read file content |
| `file_write` | Write file content |
| `file_list` | List directory contents |
| `file_delete` | Delete a file or directory |
| `session_start` | Start a persistent tmux session |
| `session_exec` | Send command to a session |
| `session_read` | Read session output |
| `session_stop` | Stop and destroy a session |

## Supported Languages for `run_script`

| Language | Runner |
|----------|--------|
| `python` | `python3` |
| `bash` | `bash` |
| `node` | `node` |
| `sh` | `sh` |

## Security

- Bearer token authentication
- Command timeout (default 30s)
- Output truncation (20KB)
- Recommended: run behind a firewall or use SSH tunnel for remote access

## Testing Checklist

1. Start the server (`npm start`)
2. Check `.env` has `MODE` and `MCP_TOKEN` set
3. For SSE mode: `curl -N -H "Authorization: Bearer your-token" http://localhost:8080/sse`
4. For remote access: ensure firewall allows the port (e.g., `sudo ufw allow 8080/tcp`)
5. Install tmux if session tools are used: `sudo apt install tmux -y`

## License

MIT
