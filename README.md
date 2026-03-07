# mongodb-mcp-legacy

[![npm version](https://img.shields.io/npm/v/mongodb-mcp-legacy.svg)](https://www.npmjs.com/package/mongodb-mcp-legacy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for **old MongoDB versions (3.2+)** that the [official MongoDB MCP Server](https://github.com/mongodb-js/mongodb-mcp-server) does not support. Works with Claude Code, Codex, Cursor, and any MCP-compatible client.

## Why This Project?

The official [mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server) uses a modern MongoDB Node.js driver that **does not work with MongoDB 3.x or 4.x**. If you're running a legacy MongoDB instance (3.2 -- 4.x) and want to connect it to AI tools like Claude Code or Cursor via MCP, you're stuck.

**mongodb-mcp-legacy** solves this by using the `mongodb@3.7.4` driver, which supports MongoDB 3.2 and above.

|                  | mongodb-mcp-legacy | Official mongodb-mcp-server |
| ---------------- | ------------------ | --------------------------- |
| MongoDB version  | **3.2+**           | 6.0+ (modern driver)        |
| Node.js version  | **>= 16**          | >= 20.19                    |
| Operations       | Read-only          | Read / Write / Atlas API    |
| Setup complexity | Zero config        | Multiple config options     |

## Features

- **Legacy MongoDB support** -- works with MongoDB 3.2, 3.4, 3.6, 4.0, 4.2, 4.4, and above
- **Read-only operations** -- safe by design, no write/update/delete tools
- **MCP compatible** -- works with any MCP client (Claude Code, Codex, Cursor, Windsurf, VS Code, etc.)
- **Zero config** -- just provide a `MONGODB_URI` and go
- **Lightweight** -- single file, minimal dependencies

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 16.0.0
- A MongoDB instance (version 3.2 or above)

### Installation

Run directly with npx (no install needed):

```bash
npx mongodb-mcp-legacy
```

Or install globally:

```bash
npm install -g mongodb-mcp-legacy
```

## Configuration

The server reads the `MONGODB_URI` environment variable to connect. If not set, it defaults to `mongodb://localhost:27017`.

### Claude Code

Add to your Claude Code config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "mongodb-legacy": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mongodb-mcp-legacy"],
      "env": {
        "MONGODB_URI": "mongodb://username:password@host:port/database"
      }
    }
  }
}
```

### Codex

Add to your Codex MCP config:

```json
{
  "mcpServers": {
    "mongodb-legacy": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mongodb-mcp-legacy"],
      "env": {
        "MONGODB_URI": "mongodb://username:password@host:port/database"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "mongodb-legacy": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mongodb-mcp-legacy"],
      "env": {
        "MONGODB_URI": "mongodb://username:password@host:port/database"
      }
    }
  }
}
```

### Other MCP Clients

Any MCP client that supports stdio transport will work. Set the command to `npx -y mongodb-mcp-legacy` and pass `MONGODB_URI` as an environment variable.

### Local Development

```bash
MONGODB_URI="mongodb://localhost:27017/mydb" node index.js
```

## Available Tools

| Tool               | Description                                                         | Parameters                                                                                                     |
| ------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `list_databases`   | List databases (falls back to current database without admin perms) | _(none)_                                                                                                       |
| `list_collections` | List all collections in a database                                  | `database` (optional)                                                                                          |
| `execute_query`    | Execute a read-only find query                                      | `database` (optional), `collection` (required), `query` (optional JSON string), `limit` (optional, default 10) |
| `count_documents`  | Count documents matching a filter                                   | `database` (optional), `collection` (required), `query` (optional JSON string)                                 |

### Examples

```text
list_databases()

list_collections({ database: "mydb" })

execute_query({ collection: "users", query: '{"status": "active"}', limit: 5 })

count_documents({ collection: "orders", query: '{"total": {"$gt": 100}}' })
```

## Development

```bash
git clone https://github.com/maximuszeng/mongodb-mcp-legacy.git
cd mongodb-mcp-legacy
pnpm install
```

> **Note:** Running the server only requires Node.js >= 16, but development and testing require Node.js >= 18 (due to pnpm and vitest).

Run the server locally:

```bash
MONGODB_URI="mongodb://localhost:27017/mydb" pnpm start
```

Lint and format:

```bash
pnpm run lint
pnpm run format
```

Run tests:

```bash
pnpm test
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
