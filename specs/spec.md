# Specification: Integrating hap-fluent & hap-test into homebridge-rabbitair

**Repository:** https://github.com/pradeepmouli/homebridge-rabbitair  
**Date:** December 30, 2025  
**Status:** Draft

## Executive Summary

This spec outlines the integration of `hap-fluent` (fluent interface for HAP characteristics) and `hap-test` (comprehensive testing harness) into the existing homebridge-rabbitair plugin. The integration will modernize the codebase, improve type safety, enhance testability, and establish a robust testing foundation.

## Background

### Current State
The homebridge-rabbitair plugin:
- **Technology:** TypeScript, based on Homebridge Plugin Template
- **Testing:** Mocha-based test framework (test/ directory exists)
- **Coverage:** Uses c8 for coverage reporting
- **Services Implemented:**
  - Air Purifier Service (Active, Current/Target State, Rotation Speed, Filter indicators)
  - Air Quality Sensor Service
- **Network Protocol:** UDP communication on port 9009 with 32-char token authentication

### Target Libraries
- **hap-fluent:** Fluent interface for HomeKit accessories with type-safe characteristic operations
- **hap-test:** Test harness with MockHomeKit, TimeController, NetworkSimulator, custom matchers

## Goals

1. **Refactor Platform Code with hap-fluent**
   - Replace imperative service/characteristic setup with fluent API
   - Improve type safety and code readability
   - Reduce boilerplate in RabbitAirAccessory implementation

2. **Establish Comprehensive Testing with hap-test**
   - Unit tests for RabbitAirClient protocol logic
   - Integration tests for platform lifecycle and accessory registration
   - End-to-end tests simulating network conditions and device states
   - Replace or complement existing Mocha tests

3. **Maintain Backward Compatibility**
   - Preserve existing configuration schema
   - No breaking changes to plugin behavior
   - Gradual migration path

## Architecture

### Package Structure
```
homebridge-rabbitair/
├── src/
│   ├── platform.ts              # RabbitAirPlatform (refactor with hap-fluent)
│   ├── platformAccessory.ts     # RabbitAirAccessory (refactor with hap-fluent)
│   ├── rabbitAirClient.ts       # UDP protocol client (keep, add tests)
│   └── settings.ts              # Configuration constants
├── test/
│   ├── unit/
│   │   ├── platform.test.ts           # Platform initialization tests
│   │   ├── platformAccessory.test.ts  # Accessory setup and state management
│   │   └── rabbitAirClient.test.ts    # Protocol and network logic
│   ├── integration/
│   │   ├── platform-lifecycle.test.ts # Full platform lifecycle
│   │   ├── accessory-updates.test.ts  # Device state synchronization
│   │   └── network-resilience.test.ts # Network failure scenarios
│   └── e2e/
│       └── rabbitair-plugin.test.ts   # Complete plugin behavior
└── package.json                  # Add hap-fluent, hap-test dependencies
```

### Dependency Integration

#### package.json Updates
```json
{
  "dependencies": {
    "hap-fluent": "workspace:*",  // or published version
    "homebridge": "^1.8.0"
  },
  "devDependencies": {
    "hap-test": "workspace:*",    // or published version
    "vitest": "^4.0.0",
    "@types/node": "^20.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run test/unit",
    "test:integration": "vitest run test/integration",
    "test:e2e": "vitest run test/e2e"
  }
}
```

#### Testing Framework Migration
- **Phase 1:** Keep Mocha for existing tests, add Vitest for new hap-test tests
- **Phase 2:** Gradually migrate Mocha tests to Vitest
- **Phase 3:** Remove Mocha dependency once migration complete

## Implementation Plan

### Phase 1: Setup & Dependencies (2-3 hours)

#### Task 1.1: Install Dependencies
```bash
cd homebridge-rabbitair
pnpm add hap-fluent homebridge
pnpm add -D hap-test vitest @vitest/coverage-istanbul
```

#### Task 1.2: Configure Vitest
Create `vitest.config.ts`:
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

#### Task 1.3: Update TypeScript Config
Ensure `tsconfig.json` includes test files:
```json
{
  "compilerOptions": {
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "test/**/*"]
}
```

### Phase 2: Refactor with hap-fluent (4-6 hours)

#### Task 2.1: Refactor RabbitAirAccessory Service Setup

**Before (Current):**
```typescript
// Imperative service setup
const service = this.accessory.getService(this.platform.Service.AirPurifier)
  || this.accessory.addService(this.platform.Service.AirPurifier);

service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

service.getCharacteristic(this.platform.Characteristic.Active)
  .onSet(this.setActive.bind(this))
  .onGet(this.getActive.bind(this));

service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
  .onSet(this.setRotationSpeed.bind(this))
  .onGet(this.getRotationSpeed.bind(this));
```

**After (with hap-fluent):**
```typescript
import { AccessoryHandler } from 'hap-fluent';

export class RabbitAirAccessory {
  private handler: AccessoryHandler;

  constructor(
    private readonly platform: RabbitAirPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // Initialize fluent handler
    this.handler = new AccessoryHandler(this, accessory);

    // Fluent service configuration
    const { airPurifier, airQualitySensor } = this.handler
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

#### Task 2.2: Implement Type-Safe State Management
```typescript
import type { InterfaceFor } from 'hap-fluent';

// Get typed interfaces for services
type AirPurifierInterface = InterfaceFor<typeof Service.AirPurifier>;
type AirQualitySensorInterface = InterfaceFor<typeof Service.AirQualitySensor>;

// Use in methods for type safety
private async updateAirPurifierState(state: AirPurifierInterface['currentAirPurifierState']) {
  // Type-safe characteristic updates
}
```

#### Task 2.3: Add Interceptors for Device State Mapping
```typescript
import { debounce, mapValues } from 'hap-fluent/interceptors';

// Apply debouncing to rotation speed to reduce UDP traffic
.characteristic('rotationSpeed')
  .interceptor(debounce(500))  // Wait 500ms before sending
  .interceptor(mapValues({
    // Map HomeKit 0-100 to RabbitAir speed levels
    0: 'silent',
    25: 'low',
    50: 'medium',
    75: 'high',
    100: 'turbo',
  }))
  .onSet(async (value) => this.setRotationSpeed(value))
```

### Phase 3: Unit Testing with hap-test (6-8 hours)

#### Task 3.1: Test RabbitAirClient Protocol Logic
Create `test/unit/rabbitAirClient.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NetworkSimulator } from 'hap-test';
import { RabbitAirClient } from '../../src/rabbitAirClient';

describe('RabbitAirClient', () => {
  let client: RabbitAirClient;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      send: vi.fn(),
      on: vi.fn(),
      close: vi.fn(),
    };
    client = new RabbitAirClient('192.168.1.100', 9009, 'test-token', mockSocket);
  });

  describe('Protocol Commands', () => {
    it('should send properly formatted power on command', async () => {
      await client.setPower(true);
      
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.any(Buffer),
        9009,
        '192.168.1.100',
        expect.any(Function)
      );
      
      // Verify command structure
      const sentBuffer = mockSocket.send.mock.calls[0][0];
      expect(sentBuffer).toMatchSnapshot();
    });

    it('should parse device state response correctly', async () => {
      const mockResponse = Buffer.from(/* ... */);
      
      const state = await client.parseState(mockResponse);
      
      expect(state).toEqual({
        power: true,
        mode: 'auto',
        fanSpeed: 'medium',
        airQuality: 2,
        filterLife: 85,
      });
    });
  });

  describe('Network Resilience', () => {
    it('should retry failed commands', async () => {
      mockSocket.send
        .mockImplementationOnce((buf, port, host, cb) => cb(new Error('Network error')))
        .mockImplementationOnce((buf, port, host, cb) => cb(null));

      await expect(client.setPower(true)).resolves.not.toThrow();
      
      expect(mockSocket.send).toHaveBeenCalledTimes(2);
    });

    it('should timeout after max retries', async () => {
      mockSocket.send.mockImplementation((buf, port, host, cb) => 
        cb(new Error('Network error'))
      );

      await expect(client.setPower(true)).rejects.toThrow('Max retries exceeded');
    });
  });
});
```

#### Task 3.2: Test RabbitAirAccessory Setup
Create `test/unit/platformAccessory.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness, toHaveService, toHaveCharacteristic } from 'hap-test';
import { RabbitAirAccessory } from '../../src/platformAccessory';

describe('RabbitAirAccessory', () => {
  let harness: TestHarness;

  beforeEach(async () => {
    harness = await TestHarness.create({
      platformConstructor: undefined as any,
      platformConfig: {
        platform: 'RabbitAir',
        name: 'RabbitAir',
        devices: [{
          name: 'Test Purifier',
          host: '192.168.1.100',
          token: '0123456789ABCDEF0123456789ABCDEF',
        }],
      },
    });
  });

  it('should register air purifier service with all characteristics', () => {
    const accessory = new RabbitAirAccessory(
      harness.platform as any,
      harness.homeKit.accessory('test-uuid')!
    );

    expect(toHaveService(harness.homeKit, 'AirPurifier').pass).toBe(true);
    
    const service = harness.homeKit.service('test-uuid', 'AirPurifier')!;
    expect(toHaveCharacteristic(service, 'Active').pass).toBe(true);
    expect(toHaveCharacteristic(service, 'CurrentAirPurifierState').pass).toBe(true);
    expect(toHaveCharacteristic(service, 'TargetAirPurifierState').pass).toBe(true);
    expect(toHaveCharacteristic(service, 'RotationSpeed').pass).toBe(true);
    expect(toHaveCharacteristic(service, 'FilterLifeLevel').pass).toBe(true);
  });

  it('should update characteristics when device state changes', async () => {
    const accessory = new RabbitAirAccessory(/* ... */);
    
    // Simulate device state update
    await accessory.updateFromDevice({
      power: true,
      mode: 'auto',
      fanSpeed: 'medium',
      airQuality: 2,
      filterLife: 85,
    });

    const active = harness.homeKit.characteristic('test-uuid', 'AirPurifier', 'Active')!;
    const speed = harness.homeKit.characteristic('test-uuid', 'AirPurifier', 'RotationSpeed')!;
    
    expect(active.value).toBe(1); // Active
    expect(speed.value).toBe(50); // Medium = 50%
  });
});
```

#### Task 3.3: Test Platform Lifecycle
Create `test/unit/platform.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from 'hap-test';
import { RabbitAirPlatform } from '../../src/platform';

describe('RabbitAirPlatform', () => {
  describe('Configuration', () => {
    it('should load platform with valid config', async () => {
      const harness = await TestHarness.create({
        platformConstructor: RabbitAirPlatform,
        platformConfig: {
          platform: 'RabbitAir',
          name: 'RabbitAir',
          devices: [
            { name: 'Purifier 1', host: '192.168.1.100', token: 'A'.repeat(32) },
            { name: 'Purifier 2', host: '192.168.1.101', token: 'B'.repeat(32) },
          ],
        },
      });

      expect(harness.platform).toBeDefined();
      expect(harness.homeKit.accessories()).toHaveLength(2);
    });

    it('should reject invalid token length', async () => {
      await expect(TestHarness.create({
        platformConstructor: RabbitAirPlatform,
        platformConfig: {
          platform: 'RabbitAir',
          devices: [
            { name: 'Test', host: '192.168.1.100', token: 'invalid' },
          ],
        },
      })).rejects.toThrow('Token must be 32 characters');
    });
  });

  describe('Cached Accessories', () => {
    it('should restore accessories from cache', async () => {
      const harness = await TestHarness.create({
        platformConstructor: RabbitAirPlatform,
        platformConfig: { /* ... */ },
      });

      // Provide cached accessories
      const cachedAccessory = /* create mock accessory */;
      harness.api.provideCachedAccessories([cachedAccessory]);

      await harness.platform.configureAccessory(cachedAccessory);

      expect(harness.homeKit.accessory('cached-uuid')).toBeDefined();
    });
  });
});
```

### Phase 4: Integration Testing (4-6 hours)

#### Task 4.1: Test Complete Platform Lifecycle
Create `test/integration/platform-lifecycle.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness } from 'hap-test';
import { RabbitAirPlatform } from '../../src/platform';

describe('RabbitAir Platform Lifecycle', () => {
  let harness: TestHarness;

  beforeEach(async () => {
    harness = await TestHarness.create({
      platformConstructor: RabbitAirPlatform,
      platformConfig: {
        platform: 'RabbitAir',
        devices: [{
          name: 'Living Room Purifier',
          host: '192.168.1.100',
          token: '0'.repeat(32),
        }],
      },
    });
  });

  it('should complete full startup sequence', async () => {
    // Verify platform initialized
    expect(harness.platform).toBeDefined();

    // Verify accessories registered
    expect(harness.homeKit.accessories()).toHaveLength(1);
    const accessory = harness.homeKit.accessory('living-room-uuid')!;
    expect(accessory.displayName).toBe('Living Room Purifier');

    // Verify services configured
    const purifierService = harness.homeKit.service('living-room-uuid', 'AirPurifier');
    expect(purifierService).toBeDefined();
  });

  it('should handle platform restart with cached accessories', async () => {
    const firstAccessories = harness.homeKit.accessories();
    
    // Simulate platform restart
    const harness2 = await TestHarness.create({
      platformConstructor: RabbitAirPlatform,
      platformConfig: { /* same config */ },
    });

    // Restore cached accessories
    harness2.api.provideCachedAccessories(firstAccessories);

    // Platform should recognize and configure cached accessories
    expect(harness2.homeKit.accessories()).toHaveLength(1);
  });
});
```

#### Task 4.2: Test Network Resilience
Create `test/integration/network-resilience.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestHarness, NetworkSimulator } from 'hap-test';
import { RabbitAirPlatform } from '../../src/platform';

describe('Network Resilience', () => {
  let harness: TestHarness;
  let simulator: NetworkSimulator;

  beforeEach(async () => {
    simulator = new NetworkSimulator();
    
    harness = await TestHarness.create({
      platformConstructor: RabbitAirPlatform,
      platformConfig: { /* ... */ },
    });

    harness.homeKit.setNetworkSimulator(simulator);
  });

  it('should handle network latency gracefully', async () => {
    vi.useFakeTimers();
    simulator.setLatency(200);

    const active = harness.homeKit.characteristic('uuid', 'AirPurifier', 'Active')!;

    const setPromise = active.setValue(1);
    await vi.advanceTimersByTimeAsync(200);
    await setPromise;

    expect(active.value).toBe(1);
    vi.useRealTimers();
  });

  it('should retry on packet loss', async () => {
    simulator.setPacketLoss(0.5); // 50% packet loss

    const active = harness.homeKit.characteristic('uuid', 'AirPurifier', 'Active')!;

    // Should eventually succeed despite packet loss
    await expect(active.setValue(1)).resolves.not.toThrow();
  });

  it('should handle device disconnection', async () => {
    simulator.disconnect();

    const active = harness.homeKit.characteristic('uuid', 'AirPurifier', 'Active')!;

    await expect(active.setValue(1)).rejects.toThrow('Network disconnected');

    // Reconnect and retry
    simulator.reconnect();
    await expect(active.setValue(1)).resolves.not.toThrow();
  });
});
```

#### Task 4.3: Test Device State Synchronization
Create `test/integration/accessory-updates.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestHarness, toHaveValue } from 'hap-test';

describe('RabbitAir Device State Updates', () => {
  let harness: TestHarness;

  beforeEach(async () => {
    harness = await TestHarness.create({
      platformConstructor: RabbitAirPlatform,
      platformConfig: { /* ... */ },
    });
  });

  it('should sync all characteristics on device state update', async () => {
    const accessory = harness.platform.accessories[0];

    // Simulate device state update from UDP poll
    await accessory.updateFromDevice({
      power: true,
      mode: 'auto',
      fanSpeed: 'high',
      airQuality: 1, // Good
      filterLife: 75,
    });

    const active = harness.homeKit.characteristic('uuid', 'AirPurifier', 'Active')!;
    const state = harness.homeKit.characteristic('uuid', 'AirPurifier', 'TargetAirPurifierState')!;
    const speed = harness.homeKit.characteristic('uuid', 'AirPurifier', 'RotationSpeed')!;
    const filter = harness.homeKit.characteristic('uuid', 'AirPurifier', 'FilterLifeLevel')!;
    const quality = harness.homeKit.characteristic('uuid', 'AirQualitySensor', 'AirQuality')!;

    expect(toHaveValue(active, 1).pass).toBe(true);
    expect(toHaveValue(state, 1).pass).toBe(true); // Auto
    expect(toHaveValue(speed, 75).pass).toBe(true); // High
    expect(toHaveValue(filter, 75).pass).toBe(true);
    expect(toHaveValue(quality, 2).pass).toBe(true); // Good
  });

  it('should trigger filter change indication when life is low', async () => {
    const accessory = harness.platform.accessories[0];

    await accessory.updateFromDevice({
      filterLife: 5, // Low filter life
    });

    const indication = harness.homeKit.characteristic('uuid', 'AirPurifier', 'FilterChangeIndication')!;
    expect(toHaveValue(indication, 1).pass).toBe(true); // Change filter
  });
});
```

### Phase 5: E2E Testing & Documentation (3-4 hours)

#### Task 5.1: Create Comprehensive E2E Test
Create `test/e2e/rabbitair-plugin.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestHarness, toHaveService, toHaveAccessory } from 'hap-test';
import { RabbitAirPlatform } from '../../src/platform';

describe('RabbitAir Plugin E2E', () => {
  it('should handle complete user workflow', async () => {
    const harness = await TestHarness.create({
      platformConstructor: RabbitAirPlatform,
      platformConfig: {
        platform: 'RabbitAir',
        devices: [{
          name: 'Bedroom Purifier',
          host: '192.168.1.100',
          token: '0'.repeat(32),
        }],
      },
    });

    // 1. Verify accessory registered
    expect(toHaveAccessory(harness.homeKit, 'bedroom-uuid').pass).toBe(true);

    // 2. Turn on purifier
    const active = harness.homeKit.characteristic('bedroom-uuid', 'AirPurifier', 'Active')!;
    await active.setValue(1);
    expect(active.value).toBe(1);

    // 3. Set to auto mode
    const targetState = harness.homeKit.characteristic('bedroom-uuid', 'AirPurifier', 'TargetAirPurifierState')!;
    await targetState.setValue(1); // Auto
    expect(targetState.value).toBe(1);

    // 4. Adjust fan speed
    const speed = harness.homeKit.characteristic('bedroom-uuid', 'AirPurifier', 'RotationSpeed')!;
    await speed.setValue(75); // High
    expect(speed.value).toBe(75);

    // 5. Check air quality
    const quality = harness.homeKit.characteristic('bedroom-uuid', 'AirQualitySensor', 'AirQuality')!;
    const qualityValue = await quality.getValue();
    expect(qualityValue).toBeGreaterThanOrEqual(0);
    expect(qualityValue).toBeLessThanOrEqual(4);

    // 6. Monitor filter life
    const filterLife = harness.homeKit.characteristic('bedroom-uuid', 'AirPurifier', 'FilterLifeLevel')!;
    const lifeValue = await filterLife.getValue();
    expect(lifeValue).toBeGreaterThanOrEqual(0);
    expect(lifeValue).toBeLessThanOrEqual(100);
  });
});
```

#### Task 5.2: Update Documentation
Create `TESTING.md` update:
```markdown
# Testing Guide

This plugin uses [hap-test](../hap-test) for comprehensive testing.

## Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

## Test Structure

- `test/unit/`: Unit tests for individual components
- `test/integration/`: Integration tests for component interactions
- `test/e2e/`: End-to-end tests for complete workflows

## Writing Tests

### Testing Accessory Setup

```typescript
import { TestHarness, toHaveService } from 'hap-test';

it('should register services correctly', async () => {
  const harness = await TestHarness.create({
    platformConstructor: RabbitAirPlatform,
    platformConfig: { /* ... */ },
  });

  expect(toHaveService(harness.homeKit, 'AirPurifier').pass).toBe(true);
});
```

### Testing Network Conditions

```typescript
import { NetworkSimulator } from 'hap-test';

it('should handle network latency', async () => {
  const simulator = new NetworkSimulator();
  simulator.setLatency(200);
  harness.homeKit.setNetworkSimulator(simulator);

  // Test characteristic operations with latency
});
```
```

#### Task 5.3: Create Migration Guide
Add to `README.md`:
```markdown
## Development

### Testing Framework

This plugin uses `hap-test` for comprehensive testing with:
- **MockHomeKit**: Simulated HomeKit controller
- **NetworkSimulator**: Network condition testing (latency, packet loss)
- **TimeController**: Deterministic time-based testing
- **Custom Matchers**: Type-safe assertions

See [TESTING.md](./TESTING.md) for detailed testing guide.

### Fluent API

The plugin uses `hap-fluent` for type-safe, fluent HomeKit service configuration:

```typescript
const { airPurifier } = handler
  .service('AirPurifier', 'Air Purifier')
    .characteristic('active')
      .onGet(async () => this.getActive())
      .onSet(async (value) => this.setActive(value))
      .parent
    .build();
```
```

## Testing Strategy

### Coverage Targets
- **Unit Tests:** 90%+ line coverage
- **Integration Tests:** All critical paths covered
- **E2E Tests:** Complete user workflows validated

### Key Test Scenarios

1. **Configuration:**
   - Valid/invalid token handling
   - Multi-device setup
   - Missing required fields

2. **Service Setup:**
   - All characteristics registered
   - Type-safe handlers configured
   - Interceptors applied correctly

3. **State Synchronization:**
   - Device → HomeKit updates
   - HomeKit → Device commands
   - Polling and event-driven updates

4. **Network Resilience:**
   - Latency handling
   - Packet loss retry logic
   - Connection failures and recovery
   - UDP socket management

5. **Edge Cases:**
   - Invalid device responses
   - Token expiration
   - Concurrent characteristic updates
   - Platform restart scenarios

## Success Criteria

- [ ] All existing Mocha tests passing
- [ ] New Vitest tests achieving 90%+ coverage
- [ ] hap-fluent refactor complete with type safety
- [ ] Network resilience tests validate retry logic
- [ ] E2E test validates complete user workflow
- [ ] Documentation updated (README, TESTING.md)
- [ ] CI/CD pipeline updated with new test commands
- [ ] No breaking changes to plugin behavior

## Migration Path

### Week 1: Setup & Initial Tests
- Install dependencies
- Configure Vitest
- Write first unit tests (RabbitAirClient)
- Keep Mocha tests running

### Week 2: Refactor with hap-fluent
- Refactor RabbitAirAccessory
- Refactor RabbitAirPlatform
- Add accessory unit tests
- Verify backward compatibility

### Week 3: Integration & E2E
- Write integration tests
- Write E2E tests
- Achieve coverage targets
- Update documentation

### Week 4: Migration & Cleanup
- Migrate remaining Mocha tests to Vitest
- Remove Mocha dependencies
- Final documentation pass
- Release

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes from refactor | High | Comprehensive test suite, gradual migration |
| hap-fluent API learning curve | Medium | Example code in tests, pair programming |
| Test flakiness with network simulation | Medium | Use fake timers, deterministic scenarios |
| Coverage gaps in existing code | Low | Prioritize critical paths first |

## Alternatives Considered

1. **Keep Mocha, add minimal hap-test:**
   - Pro: Less churn
   - Con: Miss benefits of unified testing approach

2. **Full rewrite with hap-fluent:**
   - Pro: Cleanest result
   - Con: Higher risk, longer timeline

3. **Gradual migration (chosen):**
   - Pro: Balanced risk, iterative progress
   - Con: Temporary dual-framework maintenance

## References

- [hap-fluent README](../hap-fluent/README.md)
- [hap-test README](../hap-test/README.md)
- [Homebridge Plugin Development](https://developers.homebridge.io/)
- [RabbitAir Protocol (python-rabbitair)](https://github.com/rabbit-air/python-rabbitair)
