---
applyTo: '**'
---

Coding standards, domain knowledge, and preferences that AI should follow

# JavaScript Coding Standards and Practices

This document outlines the coding standards, domain knowledge, and preferences
for a typescript project. It is designed to ensure consistency,
maintainability, and quality across the codebase.

# General Coding Standards

## 1. Code Style

- Use **Prettier** for code formatting.
- Follow the **Airbnb JavaScript Style Guide** for JavaScript and TypeScript.
- Use **ESLint** for linting with the following rules:
  - No unused variables or imports.
  - No console statements in production code.
  - Use `const` for constants and `let` for variables that will change.
  - Use arrow functions for callbacks and methods.
  - Use template literals for string interpolation.
  - Use destructuring for objects and arrays.
  - Use `===` and `!==` for equality checks.
  - Use `null` for intentional absence of value, and `undefined` for uninitialized
    variables.
  - Use `async/await` for asynchronous code instead of `.then()` and `.catch()` for promises.
- Use **TypeScript** for all new code to leverage static typing and improve
  code quality.
- Use **ES6+** features such as destructuring, template literals, and spread
  operators.
- Use **ES Modules** for module imports and exports.
- Use **import type** for importing types to avoid unnecessary code in the
  output.
- Keep configuration files in the root directory (e.g., `eslint.config.ts`,
  `prettier.config.ts`, `tsconfig.json`). These configuration files should
  be written in TypeScript to ensure type safety and consistency with the rest
  of the codebase.
- Also, ensure that the configuration files are consistent with the
  project's coding standards and practices and with each other (e.g., use a prettier plugin for ESLint
  to ensure that ESLint rules are compatible with Prettier formatting, and vice versa).
- Use **import.meta.url** for module-relative paths instead of `__dirname` or
  `__filename` to ensure compatibility with ES Modules.
-

## 2. Naming Conventions

- Use **camelCase** for variables and function names (e.g., `myVariable`,
  `calculateTotal`).
- Use **PascalCase** for class names and React components (e.g., `MyComponent`,
  `UserProfile`).
- Use **UPPER_SNAKE_CASE** for constants (e.g., `MAX_RETRIES`, `API_URL`).
- Use descriptive names that clearly indicate the purpose of the variable or
  function.
- Use prefixes for boolean variables (e.g., `isActive`, `hasPermission`).
- Use suffixes for event handlers (e.g., `onClick`, `onChange`).
- Use plural names for arrays (e.g., `users`, `items`).
- Use singular names for objects (e.g., `user`, `item`).'

## 3. Comments and Documentation

- Use JSDoc comments for functions, classes, and complex logic.
- Write clear and concise comments explaining the purpose of the code.
- Use TODO comments for unfinished work or areas that need improvement.
- Use FIXME comments for known issues that need to be addressed.
- Use descriptive commit messages that explain the changes made.
- Use the present tense in commit messages (e.g., "Fixes bug", "Adds feature").
- Use **typedoc** for generating documentation from JSDoc comments.

## 4. Error Handling

- Use `try-catch` blocks for error handling in asynchronous code.
- Use custom error classes for specific error types (e.g., `NetworkError`,
  `ValidationError`).
- Log errors using **winston** or **pino** instead of `console.log` or
  `console.error`.
- Use structured logging to include relevant context in error logs.
- Avoid using `console.error` directly; use a logging library instead.

## 5. Code Structure

- Organize code into modules and packages.
- Use **TypeScript namespaces** for grouping related types and interfaces.
- Use **TypeScript enums** for defining sets of related constants.
- Use **TypeScript interfaces** for defining contracts for objects and functions.
- Use **TypeScript types** for defining complex data structures.
- Use **TypeScript generics** for creating reusable components and functions.
- Use **TypeScript utility types** (e.g., `Partial`, `Pick`, `Omit`) for
  manipulating types for more complex scenarios, use **type-fest** for
  additional utility types.
- Use a consistent folder structure across the project.
- Use PascalCase for folder names (e.g., `Components`, `Services`, `Utils`) and file names (e.g., `MyComponent.tsx`, `UserService.ts`), with the exception of
  configuration files (e.g., `eslint.config.ts`, `prettier.config.ts`, `tsconfig.json`) and index files (e.g., `index.ts`, `index.tsx`).
- Group related files together (e.g., components, utilities, services).
- Use index files to simplify imports (e.g., `export * from './MyComponent';`).
- Keep files small and focused on a single responsibility.
- Implement generic components and utilities to avoid code duplication.
- Use both composition and inheritance for code reuse.
- Use proxy objects for dynamic behavior and to avoid tight coupling.
- Use dependency injection for managing dependencies and improving testability.
- Use type-safe APIs for communication between modules.
- Use interfaces and types to define contracts for modules and components.
- Use singleton patterns for shared resources (e.g., API clients, configuration).
- Use functional programming principles where appropriate (e.g., pure functions,
  immutability).
- Use higher-order functions for reusable logic (e.g., `map`, `filter`,
  `reduce`, `memoize`, `debounce`, `retry`).
- **_IMPORTANT_** Use decorators for cross-cutting concerns (e.g., logging, caching,
  validation, error handling).
- Use boilerplate code for common patterns (e.g., component templates, API
  handlers) - put this shared boilerplate code in a shared package, or in a
  separate file in the same package.
- Use factory classes for creating instances of classes with complex or asynchronous
  initialization logic.

## 6. Testing

- Use **Mocha** for unit testing.
- Write tests for all public functions and components.
- Use **React Testing Library** for testing React components.
- Use **Cypress** for end-to-end testing.
- Follow the **Arrange-Act-Assert** pattern for writing tests.
- Use **TypeScript** for writing tests to ensure type safety.
- Use **tsx** instead of **ts-node** for running tests to ensure compatibility with
  React components.

## 7. Version Control

- Use **Git** for version control.
- Use a consistent branching strategy (e.g., `main`, `develop`, `feature/*`,
  `bugfix/*`).
- Use pull requests for code reviews and merging changes.
- Write clear and descriptive pull request titles and descriptions.

## 8. Dependencies

- Use **npm** for package management.
- Keep dependencies up to date.
- Use **npm audit** to check for vulnerabilities in dependencies.
- Avoid using deprecated or unmaintained packages.
- Always use the latest stable versions of dependencies.
- Use **pnpm** for package management to ensure consistent dependency resolution
  and faster installs in large projects.

## 9. Performance

- Use **Lighthouse** to analyze performance and accessibility.
- Optimize images and assets.
- Use lazy loading for large components and routes.
- Avoid unnecessary re-renders in React components.

## 10. Security

- Use **Helmet** for securing HTTP headers in Express applications.
- Use **dotenvx** for managing environment variables.
- Validate and sanitize user input to prevent XSS and SQL injection attacks.
- Use HTTPS for secure communication.

## 11. Code Generation and Automation

- All code generation tools/scripts must be written in TypeScript, type-checked,
  and linted.
- Generated code must always be formatted with Prettier and pass all ESLint
  rules.
- Any changes to codegen logic/templates must be reviewed by inspecting the
  output for at least one representative device/class.
- Generated code must never include `// eslint-disable` or `@ts-ignore` comments
  except in rare, justified cases with a TODO and explanation.

## 12. AI and Copilot Usage

- Copilot and other AI tools must always generate code that is type-safe,
  documented, and idiomatic.
- AI-generated code must never bypass linting or type checks.
- When generating or updating codegen logic, always ensure the output matches
  the standards above.
- Use AI tools to assist with boilerplate code, documentation, and test
  generation, but always review and refine the output.
- AI-generated code must be reviewed for correctness, performance, and security
  before merging.
- Use AI tools to update the changelog and documentation, but ensure
  the changes are accurate and reflect the actual code changes.
- AI instructions should be kept in sync across all relevant files
  (e.g., `.github/instructions/copilot-instructions.md`, `GEMINI.md`, `CLAUDE.md`).
- **_IMPORTANT_** If you (the current AI model) are the not the best fit for a task, you should
  inform the user and suggest using a different AI model that is more suitable
  for the specific task.
