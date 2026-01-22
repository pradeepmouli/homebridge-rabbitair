# Refactor: Migrate to hap-fluent & hap-test

**Refactor ID**: refactor-001  
**Branch**: `refactor/001-migrate-hap-fluent`  
**Status**: Planning Phase  
**Created**: 2025-12-30

## Quick Summary

This refactor modernizes the homebridge-rabbitair plugin by:

1. **Migrating to hap-fluent** - Replace imperative HomeKit service setup with fluent, type-safe API
2. **Adopting hap-test** - Unified testing with MockHomeKit, NetworkSimulator, and TimeController
3. **Consolidating test frameworks** - Replace Mocha/Chai/Sinon with Vitest
4. **Improving test coverage** - Establish comprehensive unit, integration, and E2E tests

**No external behavior changes** - All existing functionality preserved, tests verify 100% compatibility.

## Specification Documents

All refactor specifications are in `/specs/refactor/001-migrate-hap-fluent/`:

### 1. **[refactor-spec.md](specs/refactor/001-migrate-hap-fluent/refactor-spec.md)** (Main Document)
- Complete refactor specification
- Code smells & justification
- 6-phase implementation plan (25-35 hours total)
- Risk assessment & rollback strategy
- Success criteria

**Key Sections:**
- Phase 0: Testing Gap Assessment (CRITICAL FIRST STEP)
- Phase 1: Setup & Dependencies (2-3 hrs)
- Phase 2: Refactor with hap-fluent (4-6 hrs)
- Phase 3: Unit Testing with hap-test (6-8 hrs)
- Phase 4: Integration Testing (4-6 hrs)
- Phase 5: E2E Testing & Documentation (3-4 hrs)
- Phase 6: Framework Migration (2-3 hrs)

### 2. **[testing-gaps.md](specs/refactor/001-migrate-hap-fluent/testing-gaps.md)** (CRITICAL)
- Identifies 7 critical test coverage gaps
- Gap severity assessment
- Acceptance criteria for each gap
- Implementation timeline
- **ACTION REQUIRED**: Fill critical gaps before baseline capture

**Critical Gaps:**
- ❌ Service registration (0% coverage)
- ❌ Network resilience (0% coverage)
- ❌ E2E workflows (0% coverage)
- ⚠️ Characteristic handlers (~40% coverage)
- ⚠️ State synchronization (~50% coverage)
- ⚠️ Network protocol/retry (~30% coverage)
- ⚠️ Platform lifecycle (~20% coverage)

### 3. **[behavioral-snapshot.md](specs/refactor/001-migrate-hap-fluent/behavioral-snapshot.md)** (Verification)
- Documents all observable behaviors (immutable contracts)
- HomeKit service exposure
- Device control flows
- Polling & update behavior
- Error handling
- Plugin lifecycle
- Multi-device scenarios

**Verification Checklist:**
- [ ] Before: All behaviors tested, baseline captured
- [ ] After: All original tests pass, behaviors identical

### 4. **[metrics-before.md](specs/refactor/001-migrate-hap-fluent/metrics-before.md)** (Auto-captured)
- Baseline metrics captured on refactor init
- Build time, dependencies, coverage baselines
- Reference point for before/after comparison

### 5. **[metrics-after.md](specs/refactor/001-migrate-hap-fluent/metrics-after.md)** (Auto-generated)
- Filled after refactor completion
- Shows improvements or regressions
- Validates refactor success

## Next Steps

### 🔴 CRITICAL FIRST STEP: Address Testing Gaps (Phase 0)

Before proceeding with refactoring, **ALL critical testing gaps must be addressed**:

1. **Service Registration Tests** (CRITICAL)
   - Verify Air Purifier service registered
   - Verify Air Quality Sensor service registered
   - Verify all characteristics with correct types
   - **Estimated**: 2 hours

2. **Characteristic Handler Tests** (HIGH)
   - Test all onSet/onGet handlers
   - Test value transformations
   - **Estimated**: 3 hours

3. **Network Resilience Tests** (CRITICAL)
   - Setup hap-test NetworkSimulator tests
   - Create latency/packet loss scenarios
   - **Estimated**: 2 hours

4. **E2E Workflow Skeleton** (CRITICAL)
   - Create basic end-to-end test template
   - Define workflow verification steps
   - **Estimated**: 1 hour

**Timeline**: 4-6 hours total  
**Definition of Done**: All tests pass, coverage ≥60%, ready for baseline

### Phase 1: Install Dependencies & Configure

```bash
cd /Users/pmouli/GitHub.nosync/homebridge-rabbitair-1

# Install hap-fluent, hap-test, Vitest
pnpm add hap-fluent @pmouli/hap-test vitest @vitest/coverage-istanbul

# Create vitest.config.ts and update tsconfig.json
# See refactor-spec.md Phase 1 for detailed instructions

# Run both test frameworks
npm run test  # Mocha (existing)
npm run test:vitest  # Vitest (new)
```

### Phase 2-6: Implement Refactoring

See [refactor-spec.md](specs/refactor/001-migrate-hap-fluent/refactor-spec.md) for detailed phase-by-phase instructions.

## Key Technologies

### hap-fluent
Fluent interface for HomeKit accessory/characteristic configuration:

```typescript
// Before: Imperative
const service = this.accessory.getService(Service.AirPurifier)
  || this.accessory.addService(Service.AirPurifier);
service.getCharacteristic(Characteristic.Active)
  .onSet(this.setActive.bind(this))
  .onGet(this.getActive.bind(this));

// After: Fluent
const { airPurifier } = handler
  .service('AirPurifier', 'Air Purifier')
    .characteristic('active')
      .onGet(async () => this.getActive())
      .onSet(async (value) => this.setActive(value))
      .parent
    .build();
```

### hap-test
Comprehensive testing harness:
- **MockHomeKit**: Full HomeKit simulation without physical device
- **NetworkSimulator**: Inject latency, packet loss, disconnection
- **TimeController**: Deterministic time for async testing
- **Custom Matchers**: Type-safe assertions (toHaveService, etc.)

```typescript
const harness = await TestHarness.create({
  platformConstructor: RabbitAirPlatform,
  platformConfig: { /* ... */ },
});

// Test network resilience
harness.homeKit.getNetworkSimulator().setLatency(200);
harness.homeKit.getNetworkSimulator().setPacketLoss(0.5);

// Test characteristic operations
const active = harness.homeKit.characteristic('uuid', 'AirPurifier', 'Active');
await active.setValue(1);
```

### Vitest
Modern test runner replacing Mocha:
- ES modules native support
- Faster test execution
- Better TypeScript integration
- Compatible with hap-test

## Risk & Mitigation

**Risk Level: MEDIUM** (vs HIGH for rewrite, LOW for no change)

| Risk | Mitigation |
|------|-----------|
| Breaking HomeKit contract | Phase 0 testing gaps, comprehensive test validation |
| Network protocol change | RabbitAirClient untouched except test coverage |
| State sync bugs | Integration tests with NetworkSimulator, E2E tests |
| Handler failures | Unit tests for all handlers before refactoring |

## Success Criteria

- ✅ **Absolute**: ALL existing behavior preserved (tests pass without modification)
- ✅ **Absolute**: ZERO breaking changes to HomeKit service contract
- ✅ **Absolute**: New tests achieve >80% code coverage
- ✅ **Strong**: hap-fluent reduces boilerplate by 30%+
- ✅ **Strong**: Type safety improved (string-based keys eliminated)
- ✅ **Strong**: Developer velocity improved for future features

## Files Affected

**Source** (Primary):
- `src/platformAccessory.ts` - Service/characteristic setup → fluent API
- `src/platform.ts` - Accessory initialization → fluent-compatible

**Tests** (New):
- `test/unit/rabbitair-client.test.ts`
- `test/unit/platform-accessory.test.ts`
- `test/unit/platform.test.ts`
- `test/integration/platform-lifecycle.test.ts`
- `test/integration/network-resilience.test.ts`
- `test/integration/accessory-updates.test.ts`
- `test/e2e/rabbitair-plugin.test.ts`

**Configuration**:
- `package.json` - Add hap-fluent, hap-test, Vitest
- `vitest.config.ts` - NEW
- `tsconfig.json` - Test support

**Documentation**:
- `TESTING.md` - Enhanced with hap-test guide
- `README.md` - Add hap-fluent examples

## Rollback Strategy

- Git branch `refactor/001-migrate-hap-fluent` for easy revert
- Keep Mocha tests running in parallel throughout
- Phase-by-phase approach enables rollback at any boundary
- All tests must pass at each phase end

## Timeline

- **Phase 0** (CRITICAL FIRST): 4-6 hours - Fill testing gaps
- **Phase 1**: 2-3 hours - Setup & dependencies
- **Phase 2**: 4-6 hours - Refactor with hap-fluent
- **Phase 3**: 6-8 hours - Unit testing with hap-test
- **Phase 4**: 4-6 hours - Integration testing
- **Phase 5**: 3-4 hours - E2E testing & docs
- **Phase 6**: 2-3 hours - Framework migration

**Total**: 25-36 hours (1 week intensive or 2-3 weeks part-time)

## Getting Started

1. **Read** [refactor-spec.md](specs/refactor/001-migrate-hap-fluent/refactor-spec.md) for complete picture
2. **Review** [testing-gaps.md](specs/refactor/001-migrate-hap-fluent/testing-gaps.md) - CRITICAL FIRST STEP
3. **Understand** [behavioral-snapshot.md](specs/refactor/001-migrate-hap-fluent/behavioral-snapshot.md) - What must not change
4. **Verify** branch `refactor/001-migrate-hap-fluent` is checked out: `git branch -v`
5. **Start** Phase 0 to address critical testing gaps

## Questions?

Refer to:
- **Technical details**: [refactor-spec.md](specs/refactor/001-migrate-hap-fluent/refactor-spec.md)
- **Testing approach**: [testing-gaps.md](specs/refactor/001-migrate-hap-fluent/testing-gaps.md)
- **Behavior validation**: [behavioral-snapshot.md](specs/refactor/001-migrate-hap-fluent/behavioral-snapshot.md)
- **hap-fluent**: [https://www.npmjs.com/package/hap-fluent](https://www.npmjs.com/package/hap-fluent)
- **hap-test**: [https://www.npmjs.com/package/@pmouli/hap-test](https://www.npmjs.com/package/@pmouli/hap-test)

---

**Status**: 🔴 Planning Phase - Waiting for Phase 0 Testing Gaps completion  
**Branch**: `refactor/001-migrate-hap-fluent`  
**Last Updated**: 2025-12-30
