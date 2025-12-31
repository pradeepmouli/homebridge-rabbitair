# Agent Instructions for homebridge-rabbitair

This document provides coding agents (GitHub Copilot, Claude Code, Gemini, Codex) with guidelines for contributing to this project.

## Workflow & Tooling

- **Version Control**: Use git with gitflow branching strategy
- **Versioning**: Follow semantic versioning (major.minor.patch)
- **Commits**: Follow Conventional Commits specification (feat:, fix:, docs:, style:, refactor:, perf:, test:, chore:)
- **Package Manager**: Use pnpm for dependency management
- **Code Generation Tools**: Use spec-kit for managing project instructions
- **Pre-commit Hooks**: Run formatters via pre-commit hooks
- **CI/CD**: GitHub Actions with formatting, linting, testing, and build steps
- **Automated Releases**: Tag releases and deploy to npm registry on version bumps

## Coding Style & Conventions

### Naming Conventions
- **Variables & Functions**: Use camelCase (e.g., `handleClick()`, `isActive`)
- **Namespaces, Modules, Classes, Types, Enums, Interfaces**: Use PascalCase (e.g., `MyClass`, `UserInterface`) and for files containing them
- **Private Class Members**: Use ES2022 `#` syntax for private fields and methods
- **Internal Class Members**: Use $ prefix for internal members (e.g., `$internalMethod()`)
- **Constants**: Use UPPER_SNAKE_CASE for constants (e.g., `MAX_RETRIES`)
- **Files & Folders**: Use PascalCase for files and folders containing application code; use kebab-case for non-application code scripts, tests and test fixtures

### Formatting
- **Indentation**: 2 spaces
- **Semicolons**: Always required at end of statements
- **Quotes**: Single quotes for strings
- **Trailing Commas**: No trailing commas in object/array literals
- **Configuration**: Align oxfmt and prettier config with these guidelines

## Coding Standards

### TypeScript & JavaScript
- Explicitly define return types for all functions; avoid `any` type
- Use strict equality (`===`, `!==`) instead of loose equality
- Use arrow functions for callbacks and functional components
- Use async/await for asynchronous operations (prefer over Promises)
- Use try/catch blocks for error handling in async functions
- Use destructuring for objects and arrays
- Use spread/rest operators for copying and merging
- Use template literals for string concatenation
- Apply eslint recommended rules for all JS/TS code

### Object-Oriented Design
- Use decorators for logging, caching, and validation
  - Logging: Use pino
  - Validation: Use Zod
- Use mixins to share functionality between classes
- Use generics liberally for reusable components and functions
- Use type aliases for union and intersection types
- Use enums for sets of named constants
- Use interfaces for defining object shapes

### APIs & Async Code
- Promisify all functions performing asynchronous operations
- Promisify callback-based APIs when needed
- Use dependency injection for managing dependencies
- Use decorators to define injectable classes and services

### Documentation & Testing
- **JSDoc Comments**: Document only public APIs (ask for clarification if unclear)
- **Unit Tests**: Use vitest for all functions and classes public APIs; aim for high coverage
- **Integration Tests**: Write for critical workflows and components
- Test files should mirror source structure: `src/foo.ts` → `test/unit/foo.test.ts`

## Technology Stack

| Use Case | Technology |
|----------|-----------|
| Language | TypeScript |
| Package Management | pnpm |
| HTTP/REST APIs | Axios |
| WebSocket | ws |
| Backend | Express.js |
| Database (Lightweight) | SQLite |
| Database (ORM) | Prisma |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Testing | vitest |
| Linting | oxlint |
| Formatting | oxfmt |
| String Manipulation | Native methods or sindresorhus utilities |
| Environment Variables | dotenvx and dotenvx/expand |
| Schema Validation | Zod |
| Task Running | tsx |
| Logging | pino |
| Advanced Types | type-fest |
| Documentation | TypeDoc |
| API Documentation | OpenAPI/Swagger |
| Monorepo | pnpm workspaces |
| Version Management | pnpm changesets |
| Error Handling | Custom error classes with structured logging |
| Code Generation | ts-morph |
| Time/Date Handling | date-fns or Day.js |

**Always use the latest stable versions** of all libraries unless otherwise specified.

## Configuration & Security

- Store sensitive configuration in environment variables
- Use `.env` files with dotenvx for development
- Never commit secrets or API keys

## Code Quality Checklist

Before submitting code:
- [ ] Follow naming conventions (camelCase for functions/variables, PascalCase for types/components)
- [ ] Add JSDoc comments for public APIs only
- [ ] Write/update unit tests with vitest
- [ ] Write integration tests for critical workflows
- [ ] Run oxlint and oxfmt to ensure style compliance
- [ ] Use explicit return types (no `any`)
- [ ] Use async/await (not Promises)
- [ ] Use strict equality (`===`, `!==`)
- [ ] Include comments explaining complex logic
- [ ] Follow Conventional Commits in commit messages

## Reference

For detailed coding preferences and project constitution, see:
- [Project Constitution](.specify/memory/constitution.md)
