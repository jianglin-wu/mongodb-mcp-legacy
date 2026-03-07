# Contributing to mongodb-mcp-legacy

Thank you for your interest in contributing! This guide will help you get started.

## Reporting Bugs

If you find a bug, please [open an issue](https://github.com/maximuszeng/mongodb-mcp-legacy/issues/new) with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Your environment (Node.js version, MongoDB version, OS)

## Requesting Features

Feature requests are welcome. Please [open an issue](https://github.com/maximuszeng/mongodb-mcp-legacy/issues/new) describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Development Setup

> **Note:** Development requires Node.js >= 18 (for pnpm and vitest). The server itself runs on Node.js >= 16.

1. Fork and clone the repository:

```bash
git clone https://github.com/<your-username>/mongodb-mcp-legacy.git
cd mongodb-mcp-legacy
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the linter:

```bash
pnpm run lint
```

4. Run tests:

```bash
pnpm test
```

## Code Style

- This project uses [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) for code quality and formatting.
- Run `pnpm run lint:fix` to auto-fix lint issues.
- Run `pnpm run format` to format code with Prettier.
- Follow the existing code style in nearby files.

## Pull Request Process

1. Create a feature branch from `main`:

```bash
git checkout -b feature/my-feature
```

2. Make your changes, ensuring:
   - All existing tests still pass (`pnpm test`)
   - New features include tests
   - Code passes linting (`pnpm run lint`)

3. Write a clear commit message in the imperative mood (e.g., "Add query validation").

4. Push your branch and open a pull request against `main`.

5. In your PR description, include:
   - A summary of the changes
   - Any related issue numbers
   - Testing details

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.
