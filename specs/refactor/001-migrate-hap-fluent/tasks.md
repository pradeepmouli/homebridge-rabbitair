# Tasks: Migrate to hap-fluent & hap-test

**Refactor ID**: refactor-001
**Branch**: `refactor/001-migrate-hap-fluent`
**Input**: [plan.md](./plan.md), [refactor-spec.md](./refactor-spec.md), [testing-gaps.md](./testing-gaps.md), [behavioral-snapshot.md](./behavioral-snapshot.md)
**Status**: Ready for Execution

---

## Format: `- [ ] [ID] [P?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- All tasks follow sequential order unless marked [P]

---

## Phase 1: Setup (Infrastructure Preparation)

**Purpose**: Install dependencies and configure test infrastructure before any implementation

**Timeline**: 30-60 minutes

- [X] T001 Install Vitest and related dependencies: `pnpm add -D vitest @vitest/coverage-istanbul`
- [X] T002 Install hap-test library: `pnpm add -D @pmouli/hap-test`
- [X] T003 [P] Create vitest.config.ts with coverage configuration
- [X] T004 [P] Update tsconfig.json to include vitest types and test files
- [X] T005 Update package.json scripts to add test:vitest, test:vitest:watch, and test:coverage commands
- [X] T006 Verify Vitest runs successfully: `pnpm test:vitest` (should pass with 0 tests)

**Checkpoint**: Test infrastructure installed and operational

---

## Phase 2: Testing Gaps - Service Registration (CRITICAL)

**Purpose**: Add missing tests for service registration BEFORE refactoring code

**Timeline**: 2 hours
**Gap**: Service registration - 0% → 100% coverage

- [X] T007 Create test/unit/platform-accessory-services.test.ts file
- [X] T008 [P] Add test: verify Air Purifier service registered with correct UUID in test/unit/platform-accessory-services.test.ts
- [X] T009 [P] Add test: verify Air Quality Sensor service registered with correct UUID in test/unit/platform-accessory-services.test.ts
- [X] T010 Add test: verify all required characteristics for Air Purifier (Active, CurrentState, TargetState, RotationSpeed, FilterLifeLevel, FilterChangeIndication) in test/unit/platform-accessory-services.test.ts
- [X] T011 Add test: verify Air Quality characteristic present in Air Quality Sensor service in test/unit/platform-accessory-services.test.ts
- [X] T012 Add test: verify characteristic types and ranges (RotationSpeed 0-100, FilterLifeLevel 0-100) in test/unit/platform-accessory-services.test.ts
- [X] T013 Run service registration tests and verify all pass: `pnpm test:vitest test/unit/platform-accessory-services.test.ts`

**Checkpoint**: Service registration fully tested (5+ tests passing)

---

## Phase 3: Testing Gaps - Characteristic Handlers

**Purpose**: Expand characteristic handler test coverage from 40% to 100%

**Timeline**: 3 hours
**Gap**: Characteristic handlers - 40% → 100% coverage

- [ ] T014 Expand test/unit/platformAccessory.test.ts with Active characteristic tests
- [ ] T015 [P] Add test: verify setActive calls client.setPower(true) when Active=1 in test/unit/platformAccessory.test.ts
- [ ] T016 [P] Add test: verify getActive returns 1 when device power=true in test/unit/platformAccessory.test.ts
- [ ] T017 Add RotationSpeed transformation tests in test/unit/platformAccessory.test.ts
- [ ] T018 [P] Add test: verify RotationSpeed 0-25% maps to Silent speed in test/unit/platformAccessory.test.ts
- [ ] T019 [P] Add test: verify RotationSpeed 26-50% maps to Low/Medium speed in test/unit/platformAccessory.test.ts
- [ ] T020 [P] Add test: verify RotationSpeed 51-75% maps to High speed in test/unit/platformAccessory.test.ts
- [ ] T021 [P] Add test: verify RotationSpeed 76-100% maps to Turbo speed in test/unit/platformAccessory.test.ts
- [ ] T022 [P] Add test: verify getRotationSpeed returns correct percentage from device speed in test/unit/platformAccessory.test.ts
- [ ] T023 Add FilterLifeLevel characteristic tests in test/unit/platformAccessory.test.ts
- [ ] T024 [P] Add test: verify getFilterLifeLevel returns device filterLife percentage in test/unit/platformAccessory.test.ts
- [ ] T025 Add FilterChangeIndication characteristic tests in test/unit/platformAccessory.test.ts
- [ ] T026 [P] Add test: verify FilterChangeIndication returns 1 when filterLife < 10% in test/unit/platformAccessory.test.ts
- [ ] T027 [P] Add test: verify FilterChangeIndication returns 0 when filterLife >= 10% in test/unit/platformAccessory.test.ts
- [ ] T028 Add test: verify error handling when client.setPower() throws error in test/unit/platformAccessory.test.ts
- [ ] T029 Run characteristic handler tests and verify all pass: `pnpm test:vitest test/unit/platformAccessory.test.ts`

**Checkpoint**: Characteristic handlers fully tested (15+ tests passing)

---

## Phase 4: Testing Gaps - Network Protocol

**Purpose**: Test network timeout and retry logic comprehensively

**Timeline**: 1 hour
**Gap**: Network protocol - 30% → 100% coverage

- [ ] T030 Expand test/unit/rabbitair-client.test.ts with network resilience tests
- [ ] T031 [P] Add test: verify client times out after 3 seconds with no response in test/unit/rabbitair-client.test.ts
- [ ] T032 [P] Add test: verify client retries on network error in test/unit/rabbitair-client.test.ts
- [ ] T033 [P] Add test: verify client fails after 3 retry attempts in test/unit/rabbitair-client.test.ts
- [ ] T034 [P] Add test: verify device response parsing for getState() in test/unit/rabbitair-client.test.ts
- [ ] T035 Run network protocol tests and verify all pass: `pnpm test:vitest test/unit/rabbitair-client.test.ts`

**Checkpoint**: Network protocol fully tested (4+ tests passing)

---

## Phase 5: Testing Gaps - Platform Lifecycle

**Purpose**: Test platform initialization and device discovery

**Timeline**: 1 hour
**Gap**: Platform lifecycle - 20% → 100% coverage

- [ ] T036 Expand test/unit/platform.test.ts with lifecycle tests
- [ ] T037 [P] Add test: verify platform initializes with valid configuration in test/unit/platform.test.ts
- [ ] T038 [P] Add test: verify platform discovers devices from config (multi-device scenario) in test/unit/platform.test.ts
- [ ] T039 [P] Add test: verify platform restores cached accessories in test/unit/platform.test.ts
- [ ] T040 [P] Add test: verify platform validates device token length (reject 31 chars) in test/unit/platform.test.ts
- [ ] T041 [P] Add test: verify platform validates required host field in test/unit/platform.test.ts
- [ ] T042 Run platform lifecycle tests and verify all pass: `pnpm test:vitest test/unit/platform.test.ts`

**Checkpoint**: Platform lifecycle fully tested (5+ tests passing)

---

## Phase 6: Testing Gaps - Network Resilience Integration

**Purpose**: Add integration tests for network conditions (latency, packet loss)

**Timeline**: 1 hour
**Gap**: Network resilience - 0% → Basic coverage

- [ ] T043 Create test/integration/network-resilience.test.ts file
- [ ] T044 Import TestHarness and NetworkSimulator from @pmouli/hap-test in test/integration/network-resilience.test.ts
- [ ] T045 [P] Add test: verify characteristic updates succeed with 200ms latency in test/integration/network-resilience.test.ts
- [ ] T046 [P] Add test: verify characteristic updates succeed with 50% packet loss via retries in test/integration/network-resilience.test.ts
- [ ] T047 Run network resilience integration tests and verify all pass: `pnpm test:vitest test/integration/network-resilience.test.ts`

**Checkpoint**: Network resilience smoke tests passing (2+ tests)

---

## Phase 7: Testing Gaps - E2E Workflow

**Purpose**: Add end-to-end workflow test skeleton

**Timeline**: 1 hour
**Gap**: E2E workflows - 0% → Basic coverage

- [ ] T048 Create test/e2e/rabbitair-plugin.test.ts file
- [ ] T049 Add test: verify complete E2E workflow (initialize → register accessory → turn on → verify state) in test/e2e/rabbitair-plugin.test.ts
- [ ] T050 Run E2E workflow test and verify passes: `pnpm test:vitest test/e2e/rabbitair-plugin.test.ts`

**Checkpoint**: E2E workflow skeleton functional (1+ test passing)

---

## Phase 8: Baseline Validation

**Purpose**: Verify all tests pass and capture comprehensive baseline metrics

**Timeline**: 30 minutes

- [ ] T051 Run all existing Mocha tests and verify 100% pass: `pnpm test`
- [ ] T052 Run all new Vitest tests and verify 100% pass: `pnpm test:vitest`
- [ ] T053 Generate coverage report and verify ≥60% coverage: `pnpm test:coverage`
- [ ] T054 Verify code passes linting: `pnpm lint`
- [ ] T055 Update specs/refactor/001-migrate-hap-fluent/metrics-before.md with comprehensive coverage data
- [ ] T056 Tag baseline commit: `git add . && git commit -m "test: add comprehensive test coverage before refactor" && git tag refactor-001-baseline`

**Checkpoint**: All tests passing, coverage ≥60%, baseline captured

---

## Phase 9: Install hap-fluent

**Purpose**: Install fluent API library and configure TypeScript

**Timeline**: 30 minutes

- [ ] T057 Install hap-fluent library: `pnpm add hap-fluent`
- [ ] T058 Verify hap-fluent imports resolve in TypeScript: create temporary test import
- [ ] T059 Update tsconfig.json to ensure test files included in compilation
- [ ] T060 Verify TypeScript compilation passes: `pnpm build`
- [ ] T061 Verify both test frameworks still pass: `pnpm test && pnpm test:vitest`

**Checkpoint**: hap-fluent installed and operational

---

## Phase 10: Refactor platformAccessory with Fluent API

**Purpose**: Migrate RabbitAirAccessory service setup to hap-fluent (BEHAVIOR MUST NOT CHANGE)

**Timeline**: 2-3 hours

- [ ] T062 Import AccessoryHandler from hap-fluent in src/platformAccessory.ts
- [ ] T063 Add private handler field to RabbitAirAccessory class in src/platformAccessory.ts
- [ ] T064 Replace Air Purifier service setup with fluent API for Active characteristic in src/platformAccessory.ts
- [ ] T065 Add fluent API for CurrentAirPurifierState characteristic in src/platformAccessory.ts
- [ ] T066 Add fluent API for TargetAirPurifierState characteristic in src/platformAccessory.ts
- [ ] T067 Add fluent API for RotationSpeed characteristic in src/platformAccessory.ts
- [ ] T068 Add fluent API for FilterLifeLevel characteristic in src/platformAccessory.ts
- [ ] T069 Add fluent API for FilterChangeIndication characteristic in src/platformAccessory.ts
- [ ] T070 Replace Air Quality Sensor service setup with fluent API for AirQuality characteristic in src/platformAccessory.ts
- [ ] T071 Call .build() on fluent chain to finalize service setup in src/platformAccessory.ts
- [ ] T072 Verify TypeScript compiles without errors: `pnpm build`
- [ ] T073 **CRITICAL**: Run all existing Mocha tests unmodified and verify 100% pass: `pnpm test`
- [ ] T074 Run all Vitest tests and verify 100% pass: `pnpm test:vitest`
- [ ] T075 Verify code passes linting: `pnpm lint`

**Checkpoint**: Fluent API implemented, ALL existing tests pass without modification

---

## Phase 11: Add Type-Safe Interfaces

**Purpose**: Improve type safety with hap-fluent interfaces

**Timeline**: 1 hour

- [ ] T076 Import InterfaceFor type from hap-fluent in src/platformAccessory.ts
- [ ] T077 Import Service from hap-nodejs in src/platformAccessory.ts
- [ ] T078 Define AirPurifierInterface type alias using InterfaceFor in src/platformAccessory.ts
- [ ] T079 Define AirQualitySensorInterface type alias using InterfaceFor in src/platformAccessory.ts
- [ ] T080 Update method signatures to use typed interfaces where applicable in src/platformAccessory.ts
- [ ] T081 Verify TypeScript compiles with strict mode: `pnpm build`
- [ ] T082 Verify no `any` types introduced in src/platformAccessory.ts
- [ ] T083 Run all tests and verify 100% pass: `pnpm test && pnpm test:vitest`

**Checkpoint**: Type-safe interfaces implemented, strict mode compliance

---

## Phase 12: Verify Platform Compatibility

**Purpose**: Ensure platform initialization works with fluent accessory

**Timeline**: 30 minutes

- [ ] T084 Review src/platform.ts for any needed fluent API compatibility changes
- [ ] T085 Verify platform accessory construction still works correctly in src/platform.ts
- [ ] T086 Run platform initialization tests and verify pass: `pnpm test:vitest test/unit/platform.test.ts`
- [ ] T087 Run full test suite and verify 100% pass: `pnpm test && pnpm test:vitest`
- [ ] T088 Commit refactor phase: `git add . && git commit -m "refactor: migrate platformAccessory to hap-fluent"`

**Checkpoint**: Platform compatible with fluent API, all tests passing

---

## Phase 13: Expand Unit Test Coverage

**Purpose**: Achieve >80% unit test coverage with comprehensive tests

**Timeline**: 6-8 hours

### RabbitAirClient Comprehensive Tests (2 hours)

- [ ] T089 Add comprehensive UDP command format tests in test/unit/rabbitair-client.test.ts
- [ ] T090 [P] Add test: verify setPower() command format in test/unit/rabbitair-client.test.ts
- [ ] T091 [P] Add test: verify setSpeed() command format in test/unit/rabbitair-client.test.ts
- [ ] T092 [P] Add test: verify setMode() command format in test/unit/rabbitair-client.test.ts
- [ ] T093 [P] Add test: verify getState() command format in test/unit/rabbitair-client.test.ts
- [ ] T094 Add comprehensive response parsing tests for all commands in test/unit/rabbitair-client.test.ts
- [ ] T095 Add edge case tests (empty response, malformed data, unexpected values) in test/unit/rabbitair-client.test.ts

### platformAccessory Comprehensive Tests (3 hours)

- [ ] T096 Add fluent service setup verification tests in test/unit/platformAccessory.test.ts
- [ ] T097 Add test: verify fluent chain creates correct service structure in test/unit/platformAccessory.test.ts
- [ ] T098 Add comprehensive value transformation tests for all characteristics in test/unit/platformAccessory.test.ts
- [ ] T099 Add error handling tests for all setters in test/unit/platformAccessory.test.ts
- [ ] T100 Add state update mechanism tests in test/unit/platformAccessory.test.ts

### Platform Comprehensive Tests (2 hours)

- [ ] T101 Add configuration loading variation tests in test/unit/platform.test.ts
- [ ] T102 [P] Add test: verify platform handles empty devices array in test/unit/platform.test.ts
- [ ] T103 [P] Add test: verify platform handles single device configuration in test/unit/platform.test.ts
- [ ] T104 [P] Add test: verify platform handles multiple devices (3+) configuration in test/unit/platform.test.ts
- [ ] T105 Add cached accessory handling edge cases in test/unit/platform.test.ts
- [ ] T106 Add platform error scenario tests in test/unit/platform.test.ts

### Coverage Validation

- [ ] T107 Generate coverage report: `pnpm test:coverage`
- [ ] T108 Review coverage report and identify remaining gaps
- [ ] T109 Add tests for any uncovered critical paths
- [ ] T110 Verify overall coverage >80% and src/ directory coverage >80%

**Checkpoint**: Unit test coverage >80%, all tests passing

---

## Phase 14: Integration Testing

**Purpose**: Test component interactions and network resilience comprehensively

**Timeline**: 4-6 hours

### Platform Lifecycle Integration (2 hours)

- [ ] T111 Create test/integration/platform-lifecycle.test.ts file
- [ ] T112 [P] Add test: verify full startup sequence with device registration in test/integration/platform-lifecycle.test.ts
- [ ] T113 [P] Add test: verify cached accessory restoration on platform restart in test/integration/platform-lifecycle.test.ts
- [ ] T114 [P] Add test: verify multi-device platform initialization in test/integration/platform-lifecycle.test.ts
- [ ] T115 Add test: verify platform restart scenario preserves device state in test/integration/platform-lifecycle.test.ts

### Network Resilience Comprehensive Tests (2 hours)

- [ ] T116 Expand test/integration/network-resilience.test.ts with comprehensive scenarios
- [ ] T117 [P] Add test: verify 50ms latency scenario in test/integration/network-resilience.test.ts
- [ ] T118 [P] Add test: verify 500ms latency scenario in test/integration/network-resilience.test.ts
- [ ] T119 [P] Add test: verify 10% packet loss scenario in test/integration/network-resilience.test.ts
- [ ] T120 [P] Add test: verify 90% packet loss scenario in test/integration/network-resilience.test.ts
- [ ] T121 Add test: verify disconnection and reconnection flow in test/integration/network-resilience.test.ts
- [ ] T122 Add test: verify timeout behavior under extreme latency in test/integration/network-resilience.test.ts
- [ ] T123 Add test: verify concurrent request handling in test/integration/network-resilience.test.ts

### State Synchronization Tests (1 hour)

- [ ] T124 Create test/integration/accessory-updates.test.ts file
- [ ] T125 [P] Add test: verify device state updates propagate to HomeKit characteristics in test/integration/accessory-updates.test.ts
- [ ] T126 [P] Add test: verify HomeKit characteristic changes send commands to device in test/integration/accessory-updates.test.ts
- [ ] T127 Add test: verify bidirectional state consistency in test/integration/accessory-updates.test.ts
- [ ] T128 Add test: verify polling behavior updates characteristics correctly in test/integration/accessory-updates.test.ts
- [ ] T129 Add test: verify filter status updates in test/integration/accessory-updates.test.ts

### Integration Test Validation

- [ ] T130 Run all integration tests and verify 100% pass: `pnpm test:vitest test/integration/`
- [ ] T131 Verify no test flakiness by running tests 3 times consecutively
- [ ] T132 Commit integration tests: `git add . && git commit -m "test: add comprehensive integration tests"`

**Checkpoint**: Integration tests comprehensive and stable

---

## Phase 15: E2E Testing & Documentation

**Purpose**: Complete end-to-end workflow tests and update documentation

**Timeline**: 3-4 hours

### E2E Workflow Tests (2 hours)

- [ ] T133 Expand test/e2e/rabbitair-plugin.test.ts with comprehensive workflows
- [ ] T134 [P] Add test: verify complete user workflow (power on → mode change → speed adjust) in test/e2e/rabbitair-plugin.test.ts
- [ ] T135 [P] Add test: verify multi-device workflow in test/e2e/rabbitair-plugin.test.ts
- [ ] T136 Add test: verify error recovery workflow in test/e2e/rabbitair-plugin.test.ts
- [ ] T137 Add test: verify long-running stability (multiple operations over time) in test/e2e/rabbitair-plugin.test.ts
- [ ] T138 Run E2E tests and verify 100% pass: `pnpm test:vitest test/e2e/`

### Documentation Updates (1-2 hours)

- [ ] T139 Update TESTING.md with hap-test usage guide and examples
- [ ] T140 Add test structure documentation to TESTING.md (unit/integration/e2e organization)
- [ ] T141 Add testing best practices section to TESTING.md
- [ ] T142 Add network resilience testing patterns to TESTING.md
- [ ] T143 Update README.md with hap-fluent examples in usage section
- [ ] T144 Update README.md development section with new test commands
- [ ] T145 Create MIGRATION.md documenting refactoring changes and rationale
- [ ] T146 Add fluent API benefits section to MIGRATION.md
- [ ] T147 Add guide for future contributors to MIGRATION.md
- [ ] T148 Review all documentation for accuracy and completeness

### Documentation Validation

- [ ] T149 Commit documentation updates: `git add . && git commit -m "docs: update for hap-fluent and hap-test"`

**Checkpoint**: E2E tests complete, documentation comprehensive

---

## Phase 16: Framework Migration & Cleanup

**Purpose**: Migrate remaining Mocha tests to Vitest and remove Mocha dependencies

**Timeline**: 2-3 hours

### Migrate Mocha Tests (1-2 hours)

- [ ] T150 Identify remaining Mocha-specific test files in test/ directory
- [ ] T151 Convert test imports from Mocha to Vitest in remaining test files
- [ ] T152 Update describe/it syntax if needed for Vitest compatibility
- [ ] T153 Update assertion style from Chai to Vitest expect in remaining test files
- [ ] T154 Update mock syntax from Sinon to Vitest vi in remaining test files
- [ ] T155 Run converted tests and verify 100% pass: `pnpm test:vitest`

### Remove Mocha Dependencies (30 minutes)

- [ ] T156 Remove mocha from package.json devDependencies
- [ ] T157 Remove chai from package.json devDependencies
- [ ] T158 Remove sinon from package.json devDependencies
- [ ] T159 Remove @types/mocha from package.json devDependencies
- [ ] T160 Remove @types/chai from package.json devDependencies
- [ ] T161 Remove @types/sinon from package.json devDependencies
- [ ] T162 Remove c8 from package.json devDependencies (replaced by Vitest coverage)
- [ ] T163 Update package.json test script to use Vitest: change "test" to "vitest run"
- [ ] T164 Add test:watch script: "vitest" in package.json
- [ ] T165 Remove old Mocha-specific scripts from package.json
- [ ] T166 Run pnpm install to update lockfile

### CI/CD Updates (30 minutes)

- [ ] T167 Check for .github/workflows/ directory and CI configuration files
- [ ] T168 Update CI test commands to use `pnpm test` (now Vitest) if CI exists
- [ ] T169 Update CI coverage commands to use `pnpm test:coverage` if CI exists
- [ ] T170 Verify CI configuration syntax if updated

### Final Verification

- [ ] T171 Run complete test suite: `pnpm test`
- [ ] T172 Generate final coverage report: `pnpm test:coverage`
- [ ] T173 Verify coverage >80% overall and for src/ directory
- [ ] T174 Verify no lint errors: `pnpm lint`
- [ ] T175 Verify build succeeds: `pnpm build`
- [ ] T176 Search codebase for Mocha remnants: `grep -r "mocha\|chai\|sinon" test/`
- [ ] T177 Commit framework migration: `git add . && git commit -m "chore: complete migration to Vitest"`

**Checkpoint**: All tests in Vitest, Mocha completely removed, tests passing

---

## Phase 17: Post-Refactor Validation

**Purpose**: Capture after metrics and validate behavior preservation

**Timeline**: 30-60 minutes

### Capture After Metrics

- [ ] T178 Measure build time: `time pnpm build` and record result
- [ ] T179 Measure test execution time: `time pnpm test` and record result
- [ ] T180 Generate coverage report: `pnpm test:coverage` and record percentages
- [ ] T181 Measure bundle size: `du -sh dist/` and record result
- [ ] T182 Update specs/refactor/001-migrate-hap-fluent/metrics-after.md with all captured metrics
- [ ] T183 Compare metrics-after.md with metrics-before.md and document improvements

### Behavioral Validation

- [ ] T184 Review specs/refactor/001-migrate-hap-fluent/behavioral-snapshot.md
- [ ] T185 Verify all HomeKit service UUIDs unchanged (Air Purifier, Air Quality)
- [ ] T186 Verify all characteristic value ranges preserved (RotationSpeed 0-100, FilterLifeLevel 0-100)
- [ ] T187 Verify UDP protocol behavior unchanged (timeout 3s, retry 3 attempts, port 9009)
- [ ] T188 Verify configuration schema structure unchanged
- [ ] T189 Verify device control flows work identically (turn on/off, mode change, speed adjust)

### Extended Testing

- [ ] T190 Run tests multiple times to check for flakiness: `for i in {1..5}; do pnpm test; done`
- [ ] T191 Verify no intermittent failures observed
- [ ] T192 Test on different Node.js version if available

### Success Validation

- [ ] T193 Verify all tests pass (100% pass rate)
- [ ] T194 Verify coverage >80% for src/ directory
- [ ] T195 Verify no breaking changes (behavioral snapshot validated)
- [ ] T196 Verify no lint errors
- [ ] T197 Verify build succeeds
- [ ] T198 Verify TypeScript strict mode compliance
- [ ] T199 Verify no `any` types introduced in src/
- [ ] T200 Verify boilerplate reduced by 30%+ (compare line counts)

**Checkpoint**: Metrics captured, behavior preserved, validation complete

---

## Phase 18: Finalization & Merge

**Purpose**: Finalize refactor and merge to main branch

**Timeline**: 30 minutes

### Final Commit

- [ ] T201 Review all changes: `git diff refactor-001-baseline..HEAD`
- [ ] T202 Stage all changes: `git add .`
- [ ] T203 Create final commit with comprehensive message documenting migration in refactor/001-migrate-hap-fluent branch
- [ ] T204 Tag refactor completion: `git tag refactor-001-complete`
- [ ] T205 Push branch and tags: `git push origin refactor/001-migrate-hap-fluent --tags`

### Create Pull Request

- [ ] T206 Create PR: "Refactor: Migrate to hap-fluent & hap-test"
- [ ] T207 Link to specs/refactor/001-migrate-hap-fluent/refactor-spec.md in PR description
- [ ] T208 Summarize changes in PR body (fluent API, Vitest migration, coverage improvements)
- [ ] T209 Highlight "No breaking changes - all external behavior preserved" in PR
- [ ] T210 Add before/after metrics comparison to PR

### Merge to Main

- [ ] T211 Checkout main branch: `git checkout latest`
- [ ] T212 Merge refactor branch: `git merge refactor/001-migrate-hap-fluent`
- [ ] T213 Tag release: `git tag v1.0.6` (PATCH version - no breaking changes)
- [ ] T214 Push to origin: `git push origin latest --tags`
- [ ] T215 Verify GitHub Actions CI passes (if configured)

**Checkpoint**: Refactor complete, merged to main, released

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2-7 (Testing Gaps) ← ALL must complete before Phase 8
    ↓
Phase 8 (Baseline Validation) ← CRITICAL CHECKPOINT
    ↓
Phase 9 (Install hap-fluent)
    ↓
Phase 10-12 (Refactor Code) ← ALL existing tests must pass
    ↓
Phase 13-14 (Expand Testing)
    ↓
Phase 15 (E2E & Docs)
    ↓
Phase 16 (Framework Migration)
    ↓
Phase 17 (Validation)
    ↓
Phase 18 (Merge)
```

### Critical Path

**MUST complete in order**:
1. Phase 1: Setup infrastructure
2. Phases 2-7: Fill all testing gaps
3. Phase 8: Baseline validation (all tests must pass)
4. Phase 9: Install hap-fluent
5. Phases 10-12: Refactor code (behavior must not change)
6. Phases 13-15: Expand testing
7. Phase 16: Framework migration
8. Phase 17-18: Validation and merge

### Parallel Opportunities

**Within phases**, tasks marked [P] can run in parallel:

- **Phase 1**: T003 and T004 (create config files)
- **Phase 2**: T008-T009 (service tests), T010-T012 (characteristic tests)
- **Phase 3**: T015-T016 (Active tests), T018-T022 (RotationSpeed tests), T024, T026-T027 (filter tests)
- **Phase 4**: T031-T034 (network protocol tests)
- **Phase 5**: T037-T041 (platform lifecycle tests)
- **Phase 6**: T045-T046 (network resilience tests)
- **Phase 13**: T090-T093 (client tests), T102-T104 (platform tests)
- **Phase 14**: T112-T114, T117-T120, T125-T126 (integration tests)
- **Phase 15**: T134-T135 (E2E tests)

**Not parallelizable**: Any task that depends on previous task completion (e.g., verification steps, commits)

---

## Rollback Procedures

### Immediate Rollback (Any Phase)

```bash
# Discard all changes and return to baseline
git reset --hard refactor-001-baseline
```

### Phase-Specific Rollback

```bash
# View commit history
git log --oneline

# Rollback to specific phase commit
git reset --hard <phase-commit-sha>
```

### Post-Merge Rollback (Emergency)

```bash
# If merged to latest and issues found
git revert -m 1 <merge-commit-sha>
git push origin latest
```

---

## Risk Management

### High-Risk Tasks

| Task | Risk | Mitigation | Rollback Point |
|------|------|------------|----------------|
| T073 | Service registration changes break HomeKit | Phase 2-7 tests validate before refactor | T056 baseline |
| T073 | Existing tests fail | All tests must pass unmodified | T088 refactor commit |
| T177 | Mocha removal breaks CI | Verify CI config updated | T149 docs commit |

### Monitoring Post-Merge

- Watch GitHub issues for HomeKit connectivity problems
- Monitor device communication failures
- Check CI/CD for test failures

---

## Summary

**Total Tasks**: 215 tasks across 18 phases
**Total Estimated Time**: 25-36 hours
**Risk Level**: MEDIUM (with comprehensive mitigation)

**Key Milestones**:
- ✅ **T056**: Baseline captured (Phase 8) - CRITICAL CHECKPOINT
- ✅ **T073**: All existing tests pass after refactor (Phase 10) - BEHAVIOR VALIDATION
- ✅ **T110**: >80% unit coverage achieved (Phase 13)
- ✅ **T177**: Mocha completely removed (Phase 16)
- ✅ **T200**: All success criteria met (Phase 17)

**Next Action**: Begin T001 - Install Vitest dependencies
