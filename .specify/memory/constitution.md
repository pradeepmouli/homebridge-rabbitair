<!-- 
  SYNC IMPACT REPORT
  ==================
  Version: 1.1.0 (Enhanced)
  Ratified: 2025-12-30
  Last Amended: 2025-12-30
  
  Version 1.1.0 Changes:
  - Added comprehensive workflow selection guidelines for spec-kit commands
  - Defined quality gates for each workflow type (baseline, feature, bugfix, enhancement, etc.)
  - Expanded Development Workflow section with core and extension workflows
  - Established workflow-specific compliance requirements
  
  Version 1.0.0 (Initial):
  - Introduced 5 core development principles aligned with user's TypeScript guidelines
  - Established testing-first discipline and HomeKit integration focus
  - Defined versioning, code quality, and security standards
  - Set governance procedures for constitution amendments and compliance
-->

# Homebridge RabbitAir Constitution

## Core Principles

### I. Test-First Discipline (NON-NEGOTIABLE)
All features MUST follow test-driven development: unit tests written → peer review → tests fail → implementation → tests pass. Unit tests MUST cover all public APIs with target >80% code coverage. Integration tests MUST validate critical workflows (device discovery, state sync, HomeKit service updates). E2E tests MUST verify end-to-end plugin lifecycle with mock RabbitAir devices. Enforcement: No PR merge without passing tests and coverage verification.

### II. TypeScript Strict Mode & Type Safety
All source code MUST use TypeScript with strict mode enabled (`noImplicitAny: true`, `strictNullChecks: true`). Explicit return types REQUIRED for all functions and class methods—never infer `any`. Use interfaces for all object shapes and enums for named constants. Generic types encouraged for reusable components. Rationale: Type safety prevents runtime errors and enhances code clarity for HomeKit integration edge cases.

### III. Semantic Versioning & Changelog Discipline
Release versions MUST follow MAJOR.MINOR.PATCH format. MAJOR: Breaking HomeKit service changes or incompatible protocol shifts; MINOR: New device support, new HomeKit characteristics, non-breaking features; PATCH: Bug fixes, internal refactors, dependency updates. Each PR MUST include CHANGELOG entries (via conventional commits or changelog file). Automated release tagging via GitHub Actions on version bump.

### IV. HomeKit Protocol Fidelity & Device Compatibility
Plugin MUST correctly expose HomeKit services: Air Purifier (active, state, speed, filters), Air Quality Sensor. All device state changes MUST synchronize bidirectionally with physical device. UDP protocol communication MUST match RabbitAir API specification. Support ALL documented device models (MinusA2, BioGS, A3) and maintain backward compatibility unless MAJOR version bump approved. Configuration schema MUST validate required fields (host, token, port) before runtime.

### V. Code Quality & Maintainability Standards
All code MUST pass oxlint (zero warnings) and oxfmt (auto-format). Decorators encouraged for logging (pino), validation (Zod), and dependency injection. JSDoc comments REQUIRED only for public APIs—internal logic documented via clear naming and inline comments for complex logic. Avoid `any` type; use union types and type aliases for clarity. Dependencies MUST be kept up-to-date (latest stable versions per npm registry).

## Security & Configuration Requirements

- **Sensitive Data**: Access tokens and IP addresses MUST be managed via HomeKit configuration schema; NO hardcoded credentials or default tokens.
- **UDP Communication**: Validate device responses; implement timeout and retry logic for unreliable network conditions.
- **Error Handling**: Structured errors logged via pino with context; never expose raw device errors to HomeKit layer.
- **Dependency Audits**: Run `npm audit` in CI/CD pipeline; fail build on high/critical vulnerabilities.

## Development Workflow & Quality Gates

### Workflow Types

Development activities SHALL use the appropriate workflow type based on the nature of the work. Each workflow enforces specific quality gates and documentation requirements tailored to its purpose.

#### Core Workflow (Feature Development)

Feature development follows a structured five-phase approach:

1. **Specify**: Feature request initiates with `/speckit.specify <description>` → generates spec.md
2. **Clarify**: Resolve ambiguities via `/speckit.clarify` → updates spec.md with resolved clarifications
3. **Plan**: Technical planning with `/speckit.plan` → creates plan.md with implementation design
4. **Tasks**: Task breakdown using `/speckit.tasks` → generates tasks.md for execution roadmap
5. **Implement**: Implementation via `/speckit.implement` → follows task order with TDD discipline

#### Extension Workflows

- **Baseline** (`/speckit.baseline`): Establish project context → generates baseline-spec.md + current-state.md documenting existing architecture and tracking all changes
- **Bugfix** (`/speckit.bugfix "<description>"`): Defect remediation → creates bug-report.md + tasks.md with mandatory regression test requirement
- **Enhancement** (`/speckit.enhance "<description>"`): Minor improvements → generates condensed enhancement.md (single-doc with spec + plan + tasks, max 7 tasks, single-phase only)
- **Modification** (`/speckit.modify <feature_num> "<description>"`): Changes to existing features → produces modification.md + impact analysis + tasks.md
- **Refactor** (`/speckit.refactor "<description>"`): Code quality improvements → creates refactor.md + baseline metrics + incremental tasks.md
- **Hotfix** (`/speckit.hotfix "<incident>"`): Emergency production issues → generates hotfix.md + expedited tasks.md + post-mortem.md (completed within 48 hours)
- **Deprecation** (`/speckit.deprecate <feature_num> "<reason>"`): Feature sunset → produces deprecation.md + dependency scan + phased tasks.md
- **Review** (`/speckit.review <task_id>`): Implementation validation → reviews code against spec + updates tasks.md + generates review report
- **Cleanup** (`/speckit.cleanup`): Repository maintenance → organizes specs/ directory + archives old branches + updates documentation

### Workflow Selection Guidelines

The correct workflow MUST be selected based on work characteristics. Using the wrong workflow violates constitution compliance:

- **Features** requiring multi-phase plans or complex coordination MUST use full feature development workflow (specify → clarify → plan → tasks → implement)
- **Enhancements** scoped to single-phase plans (≤7 tasks) MAY use streamlined enhancement workflow
- **Bug fixes** MUST use bugfix workflow to ensure regression test coverage
- **Refactorings** MUST use refactor workflow to guarantee behavior preservation
- **Emergency issues** requiring <4 hour resolution MUST use hotfix workflow

Prohibited workflow misuse:
- ❌ Features bypassing specification phase
- ❌ Bugs skipping regression test requirements
- ❌ Refactorings altering external behavior
- ❌ Enhancements exceeding single-phase scope (must escalate to feature workflow)
- ❌ Non-emergency issues using hotfix expedited process

### Quality Gates by Workflow

**Baseline**:
- Comprehensive project analysis MUST be performed covering all major components
- All architectural layers MUST be documented in baseline-spec.md
- Current state MUST enumerate all changes organized by workflow type
- Technology stack and dependencies MUST be accurately captured

**Feature Development**:
- Specification MUST be complete and pass quality checklist before planning
- Plan MUST pass constitution compliance checks before task generation
- Tests MUST be written before implementation (strict TDD adherence)
- Code review MUST verify constitution compliance (see Compliance Review checklist)

**Bugfix**:
- Bug reproduction MUST be documented with exact steps to replicate
- Regression test MUST be written and failing before fix is applied
- Root cause MUST be identified and documented in bug-report.md
- Prevention strategy MUST be defined to avoid similar issues

**Enhancement**:
- Enhancement MUST be scoped to single-phase plan with no more than 7 tasks
- Changes MUST be clearly defined in the consolidated enhancement.md document
- Tests MUST be added for new behavior (unit tests at minimum)
- If complexity exceeds single-phase scope, full feature workflow MUST be used instead

**Modification**:
- Impact analysis MUST identify all affected files, contracts, and dependencies
- Original feature spec MUST be referenced and linked
- Backward compatibility MUST be assessed (document breaking changes if any)
- Migration path MUST be documented if breaking changes introduced

**Refactor**:
- Baseline metrics MUST be captured before any changes (unless explicitly exempted)
- Tests MUST pass after EVERY incremental change (no broken intermediate states)
- Behavior preservation MUST be guaranteed (existing tests remain unchanged)
- Target metrics MUST show measurable improvement (unless explicitly exempted)

**Hotfix**:
- Severity MUST be assessed and documented (P0/P1/P2 classification)
- Rollback plan MUST be prepared before deployment
- Fix MUST be deployed and verified before writing tests (exception to TDD principle)
- Post-mortem MUST be completed within 48 hours of resolution with root cause analysis

**Deprecation**:
- Dependency scan MUST be run to identify all affected code and consumers
- Migration guide MUST be created before Phase 1 (warnings) begins
- All three phases MUST complete in sequence: warnings → disabled → removed (no phase skipping)
- Stakeholder approvals MUST be obtained before starting deprecation process

### General Process Requirements

- **Branching**: Follow gitflow (feature/*, bugfix/*, release/* branches off latest).
- **Commits**: Use Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`).
- **Code Review**: All PRs require peer review; verify test coverage, type safety, and principle alignment before merge.
- **CI/CD Pipeline** (GitHub Actions):
  - Lint check (oxlint) with max warnings = 0
  - TypeScript compilation check
  - Unit + integration + E2E test suite (all must pass)
  - Code coverage report (flag if <80%)
  - Automated release tagging on version bump (package.json → git tag)
  - Publish to npm registry on release tags
- **Pre-commit Hook**: Format code via oxfmt; run linter before commit.

## Governance

**Constitution Authority**: This constitution supersedes all informal practices and style guides. All development decisions MUST be justified against these principles.

**Amendment Procedure**: 
1. Propose amendment via GitHub issue with rationale and impact analysis.
2. Require review approval from project maintainer.
3. Document amendment reason, version bump (semantic versioning rules apply).
4. Update this file with new `LAST_AMENDED_DATE` and bumped version.
5. Propagate any breaking changes to `.specify/templates/` and `README.md`.

**Compliance Review**: Each PR checklist MUST verify:
- ✅ All tests pass (unit, integration, E2E)
- ✅ Code coverage maintained >80%
- ✅ oxlint zero warnings
- ✅ TypeScript strict mode compliance
- ✅ Explicit return types on all functions
- ✅ Configuration/security schema validated
- ✅ CHANGELOG or commit message documented
- ✅ No `any` types or implicit untyped parameters

**Runtime Guidance**: Refer to `ts.instructions.md` for day-to-day coding style (camelCase, PascalCase, indentation, decorators, testing frameworks). Constitution defines non-negotiable project values; instructions define implementation mechanics.

**Version**: 1.0.0 | **Ratified**: 2025-12-30 | **Last Amended**: 2025-12-30
