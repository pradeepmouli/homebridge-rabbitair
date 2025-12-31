# Implementation Plan: Migrate to hap-fluent & hap-test

**Refactor ID**: refactor-001
**Branch**: `refactor/001-migrate-hap-fluent`
**Created**: 2025-12-30
**Status**: Planning → Ready for Phase 0

## Plan Overview

This plan breaks down the refactoring into actionable tasks across 6 phases. Each phase has clear deliverables, success criteria, and dependencies.

**Total Estimated Time**: 25-36 hours
**Recommended Approach**: 1 week intensive OR 2-3 weeks part-time
**Risk Level**: MEDIUM

## Constitution Compliance Check

### Refactor-Specific Quality Gates

✅ **Testing Gap Assessment** (Phase 0)
- Coverage gaps identified in [testing-gaps.md](./testing-gaps.md)
- Critical gaps documented: Service registration, Network resilience, E2E workflows
- Acceptance criteria defined for each gap
- Must complete before baseline capture

✅ **Baseline Metrics Capture** (Post-Phase 0)
- Baseline metrics partially captured in [metrics-before.md](./metrics-before.md)
- Must capture comprehensive metrics after Phase 0 test additions
- Metrics will establish comparison point

✅ **Behavior Preservation**
- All behaviors documented in [behavioral-snapshot.md](./behavioral-snapshot.md)
- Immutable contracts defined (HomeKit services, UDP protocol, configuration)
- Test suite will validate no behavior changes

✅ **Incremental Validation**
- Each phase ends with all tests passing
- Rollback points at phase boundaries
- Mocha tests run in parallel with Vitest during migration

### Constitution Principles Alignment

| Principle | How This Refactor Aligns |
|-----------|--------------------------|
| **I. Test-First Discipline** | Phase 0 fills testing gaps BEFORE refactoring code; new tests written for all changes |
| **II. TypeScript Strict Mode** | hap-fluent improves type safety; eliminates string-based characteristic keys |
| **III. Semantic Versioning** | No breaking changes = PATCH version bump only |
| **IV. HomeKit Protocol Fidelity** | Behavior preservation guarantees no HomeKit contract changes |
| **V. Code Quality Standards** | All code passes oxlint/oxfmt; strict mode enforced |

**Constitution Verdict**: ✅ **APPROVED** - Refactor aligns with all constitution principles

---

## Phase 0: Testing Gap Assessment (CRITICAL FIRST STEP)

**Timeline**: 4-6 hours
**Status**: 🔴 NOT STARTED
**Priority**: CRITICAL - Must complete before any refactoring

### Objectives
- Address critical test coverage gaps identified in testing-gaps.md
- Establish baseline test suite to validate behavior preservation
- Improve coverage from ~30% to ≥60%
- Verify all tests passing before capturing baseline metrics

### Prerequisites
- ✅ Refactor branch created: `refactor/001-migrate-hap-fluent`
- ✅ Testing gaps identified and documented
- ✅ Behavioral snapshot documented

### Tasks

#### Task 0.1: Install Vitest & hap-test (30 min)
```bash
pnpm add -D vitest @vitest/coverage-istanbul @pmouli/hap-test
```

**Create**: `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', 'test/**', 'dist/**'],
    },
    include: ['test/**/*.test.ts'],
    testTimeout: 5000,
  },
});
```

**Update**: `package.json` scripts
```json
{
  "scripts": {
    "test": "mocha --require tsx 'test/**/*.test.ts'",
    "test:vitest": "vitest run",
    "test:vitest:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Verify**:
- [ ] `pnpm test:vitest` runs successfully (even with 0 tests)
- [ ] TypeScript imports resolve for vitest and hap-test

---

#### Task 0.2: Service Registration Tests (2 hours)
**Gap**: ❌ Service registration - 0% coverage → 100%
**File**: Create `test/unit/platform-accessory-services.test.ts`

**Tests to Write**:
```typescript
describe('RabbitAirAccessory - Service Registration', () => {
  it('should register Air Purifier service', () => {
    // Assert service exists with correct UUID
  });

  it('should register Air Quality Sensor service', () => {
    // Assert service exists with correct UUID
  });

  it('should register all required characteristics for Air Purifier', () => {
    // Assert: Active, CurrentState, TargetState, RotationSpeed,
    // FilterLifeLevel, FilterChangeIndication all present
  });

  it('should register Air Quality characteristic', () => {
    // Assert AirQuality characteristic present
  });

  it('should set correct characteristic types and ranges', () => {
    // Assert RotationSpeed 0-100, FilterLifeLevel 0-100, etc.
  });
});
```

**Success Criteria**:
- [ ] All service registration tests pass
- [ ] Both services verified to exist
- [ ] All characteristics verified with correct types
- [ ] Ranges validated

---

#### Task 0.3: Characteristic Handler Tests (3 hours)
**Gap**: ⚠️ Characteristic handlers - 40% → 100% coverage
**File**: Expand `test/unit/platformAccessory.test.ts`

**Tests to Write**:
```typescript
describe('RabbitAirAccessory - Characteristic Handlers', () => {
  describe('Active Characteristic', () => {
    it('should call setActive when Active is set', async () => {
      // Mock client.setPower()
      // Set Active = 1
      // Verify client.setPower(true) called
    });

    it('should return active state from getActive', async () => {
      // Mock device state power = true
      // Get Active characteristic
      // Verify returns 1
    });
  });

  describe('RotationSpeed Characteristic', () => {
    it('should transform HomeKit 0-25% to Silent speed', async () => {
      // Set RotationSpeed = 20
      // Verify client.setSpeed('silent') called
    });

    it('should transform HomeKit 50% to Medium speed', async () => {
      // Set RotationSpeed = 50
      // Verify client.setSpeed('medium') called
    });

    it('should transform HomeKit 100% to Turbo speed', async () => {
      // Set RotationSpeed = 100
      // Verify client.setSpeed('turbo') called
    });

    it('should return correct percentage from device speed', async () => {
      // Mock device speed = 'high'
      // Get RotationSpeed
      // Verify returns 75
    });
  });

  describe('FilterLifeLevel Characteristic', () => {
    it('should return filter life percentage', async () => {
      // Mock device filterLife = 85
      // Get FilterLifeLevel
      // Verify returns 85
    });
  });

  describe('FilterChangeIndication', () => {
    it('should indicate change needed when life < 10%', async () => {
      // Mock device filterLife = 5
      // Get FilterChangeIndication
      // Verify returns 1 (change needed)
    });

    it('should indicate no change when life >= 10%', async () => {
      // Mock device filterLife = 75
      // Get FilterChangeIndication
      // Verify returns 0 (OK)
    });
  });

  describe('Error Handling', () => {
    it('should handle client errors gracefully', async () => {
      // Mock client.setPower() to throw error
      // Set Active = 1
      // Verify error caught and logged, doesn't crash
    });
  });
});
```

**Success Criteria**:
- [ ] All handler tests pass
- [ ] All onSet handlers tested
- [ ] All onGet handlers tested
- [ ] Value transformations validated
- [ ] Error handling tested

---

#### Task 0.4: Network Protocol Tests (1 hour)
**Gap**: ⚠️ Network timeout/retry logic - 30% → 100%
**File**: Expand `test/unit/rabbitair-client.test.ts`

**Tests to Write**:
```typescript
describe('RabbitAirClient - Network Resilience', () => {
  it('should timeout after 3 seconds with no response', async () => {
    // Mock socket to never call callback
    // Call client.setPower()
    // Verify timeout after 3 seconds
  });

  it('should retry on network error', async () => {
    // Mock socket.send to fail once, then succeed
    // Call client.setPower()
    // Verify send called twice (retry)
  });

  it('should fail after 3 retry attempts', async () => {
    // Mock socket.send to always fail
    // Call client.setPower()
    // Verify throws error after 3 attempts
  });

  it('should parse device response correctly', async () => {
    // Mock device response buffer
    // Call client.getState()
    // Verify state parsed correctly
  });
});
```

**Success Criteria**:
- [ ] Timeout tests pass
- [ ] Retry logic tests pass
- [ ] Max retries enforcement tested
- [ ] Response parsing tested

---

#### Task 0.5: Platform Lifecycle Tests (1 hour)
**Gap**: ⚠️ Platform lifecycle - 20% → 100%
**File**: Expand `test/unit/platform.test.ts`

**Tests to Write**:
```typescript
describe('RabbitAirPlatform - Lifecycle', () => {
  it('should initialize with valid configuration', async () => {
    // Create platform with valid config
    // Assert platform initialized
  });

  it('should discover devices from config', async () => {
    // Config with 2 devices
    // Assert 2 accessories registered
  });

  it('should restore cached accessories', async () => {
    // Provide cached accessories
    // Assert restored and configured
  });

  it('should validate device token length', async () => {
    // Config with invalid token (31 chars)
    // Assert error logged, device skipped
  });

  it('should validate required host field', async () => {
    // Config missing host
    // Assert error logged, device skipped
  });
});
```

**Success Criteria**:
- [ ] Platform initialization tested
- [ ] Device discovery tested
- [ ] Cached accessory restoration tested
- [ ] Configuration validation tested

---

#### Task 0.6: Network Resilience Smoke Tests (1 hour)
**Gap**: ❌ Network resilience - 0% → Basic coverage
**File**: Create `test/integration/network-resilience.test.ts`

**Tests to Write**:
```typescript
import { TestHarness, NetworkSimulator } from '@pmouli/hap-test';

describe('Network Resilience - Smoke Tests', () => {
  let harness: TestHarness;
  let simulator: NetworkSimulator;

  beforeEach(async () => {
    harness = await TestHarness.create({
      platformConstructor: RabbitAirPlatform,
      platformConfig: { /* ... */ },
    });
    simulator = new NetworkSimulator();
  });

  it('should handle 200ms latency', async () => {
    simulator.setLatency(200);
    // Set characteristic with latency
    // Assert eventually succeeds
  });

  it('should handle 50% packet loss', async () => {
    simulator.setPacketLoss(0.5);
    // Set characteristic with packet loss
    // Assert eventually succeeds via retries
  });
});
```

**Success Criteria**:
- [ ] Basic latency test passes
- [ ] Basic packet loss test passes
- [ ] hap-test integration working

---

#### Task 0.7: E2E Workflow Skeleton (1 hour)
**Gap**: ❌ E2E workflows - 0% → Basic coverage
**File**: Create `test/e2e/rabbitair-plugin.test.ts`

**Tests to Write**:
```typescript
describe('RabbitAir Plugin E2E - Smoke Test', () => {
  it('should complete basic workflow', async () => {
    // 1. Initialize platform
    // 2. Verify accessory registered
    // 3. Turn on device
    // 4. Verify state updates
    // Assert basic flow works
  });
});
```

**Success Criteria**:
- [ ] Basic E2E test passes
- [ ] E2E test infrastructure working

---

### Phase 0 Completion Checklist

**Tests Added**:
- [ ] Service registration tests (5+ tests)
- [ ] Characteristic handler tests (15+ tests)
- [ ] Network protocol tests (4+ tests)
- [ ] Platform lifecycle tests (5+ tests)
- [ ] Network resilience smoke tests (2+ tests)
- [ ] E2E workflow skeleton (1+ test)

**Verification**:
- [ ] All Mocha tests still pass: `pnpm test`
- [ ] All Vitest tests pass: `pnpm test:vitest`
- [ ] Coverage improved to ≥60%: `pnpm test:coverage`
- [ ] No test failures or errors
- [ ] Code passes oxlint: `pnpm lint`

**Deliverables**:
- [ ] vitest.config.ts created
- [ ] package.json updated with test scripts
- [ ] 30+ new tests added across unit/integration/e2e
- [ ] All tests passing
- [ ] Coverage report generated

**Ready for Baseline Capture**:
- [ ] Run comprehensive baseline metrics capture
- [ ] Update metrics-before.md with coverage data
- [ ] Tag commit: `git tag refactor-001-baseline`

---

## Phase 1: Setup & Dependencies

**Timeline**: 2-3 hours
**Status**: 🟡 WAITING (blocked by Phase 0)
**Prerequisites**: Phase 0 complete, baseline captured

### Objectives
- Install hap-fluent library
- Configure TypeScript for fluent API
- Verify existing tests still pass
- Establish dual test framework (Mocha + Vitest)

### Tasks

#### Task 1.1: Install hap-fluent (15 min)
```bash
pnpm add hap-fluent
```

**Verify**:
- [ ] hap-fluent installed in package.json dependencies
- [ ] TypeScript can import from 'hap-fluent'

---

#### Task 1.2: Update TypeScript Configuration (15 min)
**File**: `tsconfig.json`

Ensure test files included:
```json
{
  "compilerOptions": {
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "test/**/*"]
}
```

**Verify**:
- [ ] TypeScript compilation passes: `pnpm build`
- [ ] No type errors in IDE

---

#### Task 1.3: Verify Test Framework Coexistence (30 min)
Run both frameworks:
```bash
pnpm test        # Mocha (existing tests)
pnpm test:vitest # Vitest (Phase 0 tests)
```

**Troubleshoot if needed**:
- Resolve any import conflicts
- Adjust test timeouts if needed
- Fix any environment-specific issues

**Verify**:
- [ ] All Mocha tests pass
- [ ] All Vitest tests pass
- [ ] No conflicts between frameworks

---

#### Task 1.4: Document Setup (30 min)
Update `README.md`:
- Add hap-fluent to dependencies section
- Document new test commands
- Add development setup instructions

**Verify**:
- [ ] README.md updated
- [ ] Setup instructions clear and complete

---

### Phase 1 Completion Checklist
- [ ] hap-fluent installed and imports resolve
- [ ] TypeScript configuration updated
- [ ] Both test frameworks pass
- [ ] Documentation updated
- [ ] No regressions in existing functionality
- [ ] Ready to begin refactoring code

---

## Phase 2: Refactor with hap-fluent

**Timeline**: 4-6 hours
**Status**: 🟡 WAITING (blocked by Phase 1)
**Prerequisites**: Phase 1 complete

### Objectives
- Migrate RabbitAirAccessory to fluent API
- Migrate RabbitAirPlatform for fluent compatibility
- **GUARANTEE**: No external behavior changes
- All existing Mocha tests must pass unmodified

### Tasks

#### Task 2.1: Create Fluent Accessory Handler (2 hours)
**File**: `src/platformAccessory.ts`

**Changes**:
1. Import AccessoryHandler from hap-fluent
2. Add private handler field
3. Replace service setup in constructor with fluent API

**Before**:
```typescript
const service = this.accessory.getService(this.platform.Service.AirPurifier)
  || this.accessory.addService(this.platform.Service.AirPurifier);

service.getCharacteristic(this.platform.Characteristic.Active)
  .onSet(this.setActive.bind(this))
  .onGet(this.getActive.bind(this));
// ... repeated for 8+ characteristics
```

**After**:
```typescript
import { AccessoryHandler } from 'hap-fluent';

export class RabbitAirAccessory {
  private handler: AccessoryHandler;

  constructor(
    private readonly platform: RabbitAirPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.handler = new AccessoryHandler(this, accessory);

    const { airPurifier, airQuality } = this.handler
      .service('AirPurifier', 'Air Purifier')
        .characteristic('active')
          .onGet(async () => this.getActive())
          .onSet(async (value) => this.setActive(value))
          .parent
        .characteristic('currentAirPurifierState')
          .onGet(async () => this.getCurrentState())
          .parent
        .characteristic('targetAirPurifierState')
          .onSet(async (value) => this.setTargetState(value))
          .onGet(async () => this.getTargetState())
          .parent
        .characteristic('rotationSpeed')
          .onSet(async (value) => this.setRotationSpeed(value))
          .onGet(async () => this.getRotationSpeed())
          .parent
        .characteristic('filterLifeLevel')
          .onGet(async () => this.getFilterLife())
          .parent
        .characteristic('filterChangeIndication')
          .onGet(async () => this.getFilterChangeIndication())
          .parent
      .service('AirQualitySensor', 'Air Quality')
        .characteristic('airQuality')
          .onGet(async () => this.getAirQuality())
          .parent
      .build();
  }
}
```

**Verify**:
- [ ] TypeScript compiles without errors
- [ ] All existing Mocha tests still pass
- [ ] Code passes oxlint

---

#### Task 2.2: Add Type-Safe Interfaces (1 hour)
**File**: `src/platformAccessory.ts`

```typescript
import type { InterfaceFor } from 'hap-fluent';
import { Service } from 'hap-nodejs';

type AirPurifierInterface = InterfaceFor<typeof Service.AirPurifier>;
type AirQualitySensorInterface = InterfaceFor<typeof Service.AirQualitySensor>;
```

Use in methods for type safety:
```typescript
private async updateAirPurifierState(state: AirPurifierInterface['currentAirPurifierState']): Promise<void> {
  // Type-safe state updates
}
```

**Verify**:
- [ ] Type interfaces compile
- [ ] Methods use typed interfaces
- [ ] No `any` types introduced

---

#### Task 2.3: Update Platform Initialization (1 hour)
**File**: `src/platform.ts`

Ensure platform initialization compatible with fluent accessory:
- Verify accessory construction still works
- No changes needed if accessory handles own setup

**Verify**:
- [ ] Platform initializes correctly
- [ ] Accessories registered successfully
- [ ] All existing tests pass

---

#### Task 2.4: Run Full Test Suite (30 min)
```bash
pnpm test        # All Mocha tests must pass
pnpm test:vitest # All Vitest tests must pass
pnpm lint        # Must pass oxlint
pnpm build       # Must compile successfully
```

**Verify**:
- [ ] **CRITICAL**: All existing Mocha tests pass WITHOUT modification
- [ ] All Vitest tests pass
- [ ] No lint errors
- [ ] Build succeeds
- [ ] No behavior changes observed

---

### Phase 2 Completion Checklist
- [ ] RabbitAirAccessory uses fluent API
- [ ] Type-safe interfaces implemented
- [ ] Platform initialization updated
- [ ] **ALL existing tests pass unmodified**
- [ ] Code passes oxlint/oxfmt
- [ ] TypeScript strict mode compliance
- [ ] Commit with message: `refactor: migrate platformAccessory to hap-fluent`

---

## Phase 3: Unit Testing with hap-test

**Timeline**: 6-8 hours
**Status**: 🟡 WAITING (blocked by Phase 2)
**Prerequisites**: Phase 2 complete

### Objectives
- Expand unit test coverage to >80%
- Test all fluent API setup
- Test all characteristic handlers comprehensively
- Establish testing patterns

### Tasks

#### Task 3.1: Expand RabbitAirClient Tests (2 hours)
**File**: `test/unit/rabbitair-client.test.ts`

Add comprehensive protocol tests:
- All UDP command formats
- Response parsing for all commands
- Error scenarios
- Edge cases

**Target**: 100% coverage of rabbitAirClient.ts

---

#### Task 3.2: Expand platformAccessory Tests (3 hours)
**File**: `test/unit/platform-accessory.test.ts`

Test all aspects:
- Fluent service setup verification
- All characteristic handler operations
- Value transformations in detail
- Error handling scenarios
- State update mechanisms

**Target**: 90%+ coverage of platformAccessory.ts

---

#### Task 3.3: Expand Platform Tests (2 hours)
**File**: `test/unit/platform.test.ts`

Test platform thoroughly:
- Configuration loading variations
- Multi-device scenarios
- Cached accessory handling
- Error scenarios

**Target**: 85%+ coverage of platform.ts

---

#### Task 3.4: Generate Coverage Report (30 min)
```bash
pnpm test:coverage
```

Review coverage report:
- Check line coverage by file
- Identify any remaining gaps
- Document justified exclusions

**Verify**:
- [ ] Overall coverage >80%
- [ ] src/ directory coverage >80%
- [ ] Critical paths 100% covered

---

### Phase 3 Completion Checklist
- [ ] Unit test coverage >80%
- [ ] All protocol tests comprehensive
- [ ] All handler tests comprehensive
- [ ] Platform tests comprehensive
- [ ] Coverage report generated and reviewed
- [ ] All tests passing
- [ ] Commit: `test: expand unit test coverage with hap-test`

---

## Phase 4: Integration Testing

**Timeline**: 4-6 hours
**Status**: 🟡 WAITING (blocked by Phase 3)
**Prerequisites**: Phase 3 complete

### Objectives
- Test component interactions
- Validate network resilience with NetworkSimulator
- Test state synchronization flows end-to-end

### Tasks

#### Task 4.1: Platform Lifecycle Integration (2 hours)
**File**: `test/integration/platform-lifecycle.test.ts`

Tests:
- Full startup sequence
- Cached accessory restoration
- Multi-device scenarios
- Platform restart scenarios

---

#### Task 4.2: Network Resilience Tests (2 hours)
**File**: `test/integration/network-resilience.test.ts`

Comprehensive network testing:
- Latency scenarios (50ms, 200ms, 500ms)
- Packet loss scenarios (10%, 50%, 90%)
- Disconnection/reconnection flows
- Timeout behavior validation
- Concurrent request handling

---

#### Task 4.3: State Synchronization Tests (1 hour)
**File**: `test/integration/accessory-updates.test.ts`

Tests:
- Device → HomeKit characteristic updates
- HomeKit → Device command flow
- Bidirectional state consistency
- Polling behavior
- Filter status updates

---

### Phase 4 Completion Checklist
- [ ] All integration tests pass
- [ ] Network resilience thoroughly tested
- [ ] State synchronization validated
- [ ] No test flakiness
- [ ] Commit: `test: add comprehensive integration tests`

---

## Phase 5: E2E Testing & Documentation

**Timeline**: 3-4 hours
**Status**: 🟡 WAITING (blocked by Phase 4)
**Prerequisites**: Phase 4 complete

### Objectives
- Complete E2E workflow tests
- Update all documentation
- Create developer guides

### Tasks

#### Task 5.1: Complete E2E Tests (2 hours)
**File**: `test/e2e/rabbitair-plugin.test.ts`

Full workflow tests:
- Complete user workflow (power on → mode change → speed adjust)
- Multi-device workflow
- Error recovery workflow
- Long-running stability test

---

#### Task 5.2: Update Documentation (1-2 hours)

**TESTING.md**:
- Add hap-test usage guide
- Document test structure
- Add testing best practices
- Network resilience testing patterns

**README.md**:
- Add hap-fluent examples
- Update development section
- Document new test commands

**Create MIGRATION.md**:
- Document refactoring changes
- Explain fluent API benefits
- Guide for future contributors

---

### Phase 5 Completion Checklist
- [ ] E2E tests comprehensive
- [ ] TESTING.md updated
- [ ] README.md updated
- [ ] MIGRATION.md created
- [ ] All documentation reviewed
- [ ] Commit: `docs: update for hap-fluent and hap-test`

---

## Phase 6: Framework Migration & Cleanup

**Timeline**: 2-3 hours
**Status**: 🟡 WAITING (blocked by Phase 5)
**Prerequisites**: Phase 5 complete

### Objectives
- Migrate remaining Mocha tests to Vitest
- Remove Mocha dependencies
- Finalize testing infrastructure

### Tasks

#### Task 6.1: Migrate Mocha Tests (1-2 hours)
Convert test files from Mocha format to Vitest:
- Update imports (Mocha → Vitest)
- Update describe/it syntax if needed
- Update assertion style
- Update mock syntax

**Files to migrate**:
- `test/unit/*.test.ts` (if any remain)
- `test/integration/*.test.ts` (if any remain)

---

#### Task 6.2: Remove Mocha Dependencies (30 min)
**File**: `package.json`

Remove:
- mocha
- chai
- sinon
- @types/mocha
- @types/chai
- @types/sinon

Update scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

#### Task 6.3: Update CI/CD Pipeline (30 min)
**File**: `.github/workflows/*.yml` (if exists)

Update test commands to use Vitest:
```yaml
- name: Run tests
  run: pnpm test

- name: Generate coverage
  run: pnpm test:coverage
```

---

#### Task 6.4: Final Verification (30 min)
Run complete test suite:
```bash
pnpm test
pnpm test:coverage
pnpm lint
pnpm build
```

**Verify**:
- [ ] All tests pass
- [ ] Coverage >80%
- [ ] No lint errors
- [ ] Build succeeds
- [ ] No Mocha remnants

---

### Phase 6 Completion Checklist
- [ ] All tests migrated to Vitest
- [ ] Mocha dependencies removed
- [ ] CI/CD updated
- [ ] All tests passing
- [ ] Final coverage >80%
- [ ] Commit: `chore: complete migration to Vitest`

---

## Post-Refactor Validation

### Final Verification Steps

1. **Capture After Metrics**
   ```bash
   # Build time
   time pnpm build

   # Test execution time
   time pnpm test

   # Coverage report
   pnpm test:coverage

   # Bundle size
   du -sh dist/
   ```

2. **Update metrics-after.md**
   - Compare with metrics-before.md
   - Document improvements
   - Note any regressions

3. **Verify Behavioral Snapshot**
   - All behaviors from behavioral-snapshot.md still valid
   - No observable changes
   - HomeKit contracts preserved

4. **Run Extended Tests**
   - Let tests run multiple times to catch flakiness
   - Test on different environments if possible

### Success Validation Checklist

**Absolute Requirements** (MUST ALL PASS):
- [ ] All tests pass (100% pass rate)
- [ ] Coverage >80% for src/
- [ ] No breaking changes (behavioral snapshot validated)
- [ ] No lint errors
- [ ] Build succeeds
- [ ] TypeScript strict mode compliance
- [ ] No `any` types introduced

**Strong Goals**:
- [ ] Boilerplate reduced by 30%+
- [ ] Type safety improved
- [ ] Test execution faster than before
- [ ] Developer experience improved

### Merge to Main

Once all validation passes:

1. **Commit final changes**
   ```bash
   git add .
   git commit -m "refactor: complete migration to hap-fluent and hap-test

   - Migrate platformAccessory to fluent API
   - Replace Mocha with Vitest
   - Add comprehensive test coverage (>80%)
   - Improve type safety with hap-fluent
   - Add network resilience testing with hap-test

   BREAKING CHANGE: None (all external behavior preserved)"
   ```

2. **Create PR**
   - Title: "Refactor: Migrate to hap-fluent & hap-test"
   - Link to refactor-spec.md
   - Summarize changes
   - Highlight no breaking changes

3. **Merge and tag**
   ```bash
   git checkout latest
   git merge refactor/001-migrate-hap-fluent
   git tag v1.0.6  # PATCH version (no breaking changes)
   git push origin latest --tags
   ```

---

## Rollback Procedures

If issues discovered at any phase:

### Immediate Rollback
```bash
# Discard all changes and return to baseline
git reset --hard refactor-001-baseline
```

### Selective Rollback
```bash
# Rollback to specific phase
git log --oneline
git reset --hard <phase-commit-sha>
```

### Emergency Rollback
If merged to main and issues found:
```bash
# Revert the merge commit
git revert -m 1 <merge-commit-sha>
git push origin latest
```

---

## Risk Management

### High-Risk Areas
1. **Service registration changes** - Most likely to break HomeKit
   - Mitigation: Phase 0 tests validate before refactor
   - Rollback: Can revert platformAccessory.ts only

2. **Network protocol behavior** - Could affect device communication
   - Mitigation: RabbitAirClient untouched; only test coverage added
   - Rollback: Phase-specific rollback

3. **State synchronization** - Could cause inconsistent states
   - Mitigation: Integration tests validate bidirectional flow
   - Rollback: Phase 4 boundary

### Monitoring Post-Merge
- Watch for GitHub issues related to HomeKit connectivity
- Monitor for device communication failures
- Check for test failures in CI/CD

---

## Summary

**Total Tasks**: ~35 tasks across 6 phases
**Total Estimated Time**: 25-36 hours
**Risk Level**: MEDIUM (with comprehensive mitigation)

**Critical Path**:
Phase 0 (testing gaps) → Phase 1 (setup) → Phase 2 (refactor) → Phase 3-6 (testing & cleanup)

**Key Success Factors**:
1. Complete Phase 0 before any code refactoring
2. Keep all existing tests passing throughout
3. Validate at each phase boundary
4. Comprehensive testing at all levels

**Next Action**: Begin Phase 0 - Testing Gap Assessment
