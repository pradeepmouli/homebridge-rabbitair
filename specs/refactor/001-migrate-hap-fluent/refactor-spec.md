# Refactor Spec: Migrate to hap-fluent & hap-test

**Refactor ID**: refactor-001  
**Branch**: `refactor/001-migrate-hap-fluent`  
**Created**: 2025-12-30  
**Type**: [x] Maintainability | [x] Architecture | [x] Tech Debt  
**Impact**: [x] Medium Risk  
**Status**: [x] Planning

## Input
User description: "Migrate to hap-fluent and hap-test: Refactor platform and platformAccessory with fluent API, replace Mocha with Vitest, establish comprehensive testing with hap-test harness including MockHomeKit, NetworkSimulator, and TimeController for improved type safety, testability, and development experience"

## Motivation

### Current State Problems

**Code Smells**:
- [x] Duplication (repetitive characteristic setup in platformAccessory.ts)
- [x] Feature Envy (manual characteristic key access via string identifiers)
- [x] Primitive Obsession (string-based characteristic and service names)
- [x] Tight Coupling (service setup tightly coupled to Homebridge API)
- [x] Magic Numbers (fan speed 0-100 scale mapping duplicated)
- [x] Dead Code (incomplete network simulation in tests)

**Concrete Examples**:
- `src/platformAccessory.ts` lines 45-120: Repetitive `getCharacteristic().onSet().onGet()` pattern for 8+ characteristics
- `src/platform.ts` lines 25-50: String-based service type references with no compile-time validation
- `test/unit/platformAccessory.test.ts`: Limited service registration testing
- `test/integration/`: Missing network resilience tests (latency, packet loss, disconnection)
- `test/e2e/`: No comprehensive end-to-end workflow testing

### Business/Technical Justification

**Why refactoring needed NOW**:
- [x] Blocking new features (difficult to add new characteristics without template duplication)
- [x] Developer velocity impact (boilerplate setup slows feature development)
- [x] Technical debt accumulation (three test frameworks: Mocha, Chai, Sinon)
- [x] Testing gaps (network resilience and state synchronization under-tested)

**Impact of delay**:
- Continued use of imperative API limits team velocity
- New developers face learning curve with string-based characteristic management
- Testing debt compounds as more features added
- No comprehensive network failure coverage

## Proposed Improvement

### Refactoring Patterns

**Primary Techniques**:
1. **Replace Imperative with Fluent Interface** - Service/characteristic setup → hap-fluent builder pattern
2. **Introduce Type Aliases** - String-based keys → TypeScript interfaces for type safety
3. **Extract Test Harness** - Mocha → Vitest + hap-test for unified testing
4. **Introduce Test Utility** - NetworkSimulator for deterministic network testing

**High-Level Approach**:
Replace imperative `getCharacteristic().onSet().onGet()` chains with fluent, type-safe hap-fluent API. Consolidate testing from Mocha/Chai/Sinon to Vitest with hap-test harness for comprehensive MockHomeKit simulation, network condition injection, and deterministic time control. Maintain 100% external behavior compatibility—refactor is internal only.

### Before/After Comparison

**Before (platformAccessory.ts - imperative):**
```typescript
const service = this.accessory.getService(this.platform.Service.AirPurifier)
  || this.accessory.addService(this.platform.Service.AirPurifier);

service.setCharacteristic(this.platform.Characteristic.Name, name);

service.getCharacteristic(this.platform.Characteristic.Active)
  .onSet(this.setActive.bind(this))
  .onGet(this.getActive.bind(this));

service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
  .onSet(this.setRotationSpeed.bind(this))
  .onGet(this.getRotationSpeed.bind(this));

// ... repeated pattern for 8+ characteristics
```

**After (platformAccessory.ts - hap-fluent):**
```typescript
const { airPurifier, airQuality } = this.handler
  .service('AirPurifier', 'Air Purifier')
    .characteristic('active')
      .onGet(async () => this.getActive())
      .onSet(async (value) => this.setActive(value))
      .parent
    .characteristic('rotationSpeed')
      .onSet(async (value) => this.setRotationSpeed(value))
      .onGet(async () => this.getRotationSpeed())
      .parent
    // ... remaining characteristics
  .service('AirQualitySensor', 'Air Quality')
    .characteristic('airQuality')
      .onGet(async () => this.getAirQuality())
      .parent
  .build();
```

**Benefits**: 40% less boilerplate, type-safe access, readable fluent chain

### Testing Consolidation

**Before (Mocha + Chai + Sinon + c8)**  
→ **After (Vitest + hap-test with MockHomeKit, NetworkSimulator, TimeController)**

Benefits: Unified framework, network condition injection, deterministic testing

## Phase 0: Testing Gap Assessment (CRITICAL FIRST STEP)

**BEFORE capturing baseline metrics, assess test coverage of areas being refactored.**

### Coverage Gaps Identified

| Component | Current Coverage | Required Coverage | Gap |
|-----------|------------------|-------------------|-----|
| Service registration | 0% | 100% | CRITICAL |
| Characteristic handlers | 40% | 100% | HIGH |
| Device state → HomeKit sync | 50% | 100% | HIGH |
| Network timeout/retry logic | 30% | 100% | HIGH |
| Platform lifecycle | 20% | 100% | HIGH |
| Network resilience (latency, loss, disconnect) | 0% | 100% | CRITICAL |
| E2E user workflows | 0% | 100% | CRITICAL |

### Critical Tests to Add Before Baseline

**MANDATORY before baseline capture:**
1. Unit tests for ALL service/characteristic registration in platformAccessory.ts
2. Unit tests for ALL characteristic handlers (getters/setters)
3. Integration tests for platform + accessory initialization together
4. Integration tests for device state synchronization (bidirectional)
5. Unit tests for RabbitAirClient network timeout/retry edge cases
6. E2E test demonstrating complete user workflow

See [testing-gaps.md](./testing-gaps.md) for detailed assessment.

## Phases 1-6: Implementation Plan

### Phase 1: Setup & Dependencies (2-3 hours)
- Install hap-fluent, hap-test, Vitest
- Configure vitest.config.ts
- Update TypeScript configuration
- Capture baseline metrics
- **Definition of Done**: Both Mocha and Vitest pass, baseline captured

### Phase 2: Refactor with hap-fluent (4-6 hours)
- Migrate RabbitAirAccessory to fluent API
- Migrate RabbitAirPlatform initialization
- **GUARANTEE**: No external behavior changes
- **Definition of Done**: All existing Mocha tests pass unmodified

### Phase 3: Unit Testing with hap-test (6-8 hours)
- Comprehensive unit tests for protocol, service setup, handlers
- Achieve >80% code coverage
- **Definition of Done**: Unit coverage >80%, all tests passing

### Phase 4: Integration Testing (4-6 hours)
- Test component interactions with network resilience
- Use NetworkSimulator for condition injection
- **Definition of Done**: All critical paths tested, network resilience validated

### Phase 5: E2E Testing & Documentation (3-4 hours)
- Complete user workflow E2E tests
- Update TESTING.md and README
- **Definition of Done**: E2E tests comprehensive, docs updated

### Phase 6: Framework Migration (2-3 hours)
- Migrate remaining Mocha tests to Vitest
- Remove Mocha dependencies
- **Definition of Done**: All tests in Vitest, Mocha removed

## Behavior Preservation Requirements

**CARDINAL RULE: External behavior MUST NOT change.** Every test that passes before refactoring MUST pass after refactoring without any modifications.

### HomeKit Service Contract (IMMUTABLE)

**Air Purifier Service:**
- Active (boolean: on/off)
- CurrentAirPurifierState (0=inactive, 1=idle, 2=purifying)
- TargetAirPurifierState (0=manual, 1=auto)
- RotationSpeed (0-100%)
- FilterLifeLevel (0-100%)
- FilterChangeIndication (0=no change, 1=change filter)

**Air Quality Sensor Service:**
- AirQuality (0=excellent, 1=good, 2=fair, 3=poor, 4=unknown)

**No changes allowed to**: Service UUIDs, characteristic types, ranges, R/W permissions, notifications

### Device Protocol Contract (IMMUTABLE)

- UDP protocol on port 9009
- Command format: [device_type][command_code][parameters][checksum]
- Token: 32-character hexadecimal string
- Timeout: 3 seconds per command
- Retry: 3 attempts on failure
- Speed mapping: Silent (0-25), Low (26-50), Medium (51-75), High (76-99), Turbo (100)

### Configuration Schema (IMMUTABLE)

```json
{
  "platform": "RabbitAir",
  "devices": [
    {
      "name": "Device Name",
      "host": "192.168.1.100",
      "token": "32-char-hex-string",
      "port": 9009
    }
  ]
}
```

## Risk Assessment

**Risk Level: MEDIUM**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Breaking HomeKit service contract | LOW | CRITICAL | Phase 0 testing assessment, comprehensive tests |
| Network protocol change | LOW | CRITICAL | RabbitAirClient untouched except test coverage |
| State synchronization bug | MEDIUM | HIGH | Integration tests with NetworkSimulator, E2E tests |
| Characteristic handler failure | MEDIUM | HIGH | Unit tests for all handlers |
| Performance degradation | LOW | MEDIUM | Baseline metrics capture before/after |

**Rollback Strategy**: Git branch allows easy revert; Mocha tests run in parallel; Phase-by-phase approach enables rollback at any boundary

## Success Criteria

**Absolute Must-Haves:**
- ✅ ALL existing behavior preserved (tests pass without modification)
- ✅ ZERO breaking changes to HomeKit service contract or device protocol
- ✅ New unit tests achieve >80% code coverage
- ✅ Integration tests validate all critical paths
- ✅ E2E tests demonstrate complete workflows
- ✅ Code passes oxlint and oxfmt
- ✅ TypeScript strict mode compliance

**Strong Goals:**
- ✅ hap-fluent refactor reduces boilerplate by 30%+
- ✅ Type safety improved (string-based keys eliminated)
- ✅ NetworkSimulator enables robust network testing
- ✅ Unified Vitest framework (Mocha removed)
- ✅ Developer velocity improved for future features

## Related Documents

- [Testing Gaps Assessment](./testing-gaps.md) - CRITICAL FIRST STEP
- [Behavioral Snapshot](./behavioral-snapshot.md) - Immutable contracts
- [Baseline Metrics](./metrics-before.md) - Before measurements
- [Target Metrics](./metrics-after.md) - After expectations
