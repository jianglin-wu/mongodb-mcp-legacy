# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-08

### Added

- MCP server for legacy MongoDB (3.2+) via stdio transport
- `list_databases` tool -- queries the server, falls back to current database without admin privileges
- `list_collections` tool -- lists collections with optional database parameter
- `execute_query` tool -- read-only find operations with optional database, query filter, and limit
- `count_documents` tool -- counts documents matching a query filter with optional database
- Lazy MongoDB connection management with configurable timeout
- Support for `MONGODB_URI` environment variable
- Credential sanitization in error messages
- Graceful shutdown on SIGINT/SIGTERM
- ESLint, Prettier, Vitest, and GitHub Actions CI
