# Testing

This project includes comprehensive unit, integration, and end-to-end (E2E) tests to ensure the reliability and correctness of the RabbitAir Homebridge plugin.

## Test Structure

```
test/
├── fixtures/          # Mock data and test utilities
│   └── mockData.ts    # Common test data and mock objects
├── integration/       # Integration tests
│   ├── platform.test.ts   # Platform lifecycle tests
│   └── plugin.test.ts     # Plugin registration tests
├── e2e/              # End-to-end tests
│   ├── MockRabbitAirServer.ts  # Mock UDP server for device simulation
│   └── homebridge.test.ts      # E2E flow validation tests
└── unit/             # Unit tests
    ├── enums.test.ts           # Enum value tests
    ├── platform.test.ts       # RabbitAirPlatform tests
    ├── platformAccessory.test.ts # RabbitAirAccessory tests
    └── rabbitair-client.test.ts   # RabbitAirClient tests
```

## Test Framework

- **Test Runner**: Vitest
- **Assertion Library**: Vitest (built-in `expect` API)
- **Mocking Library**: Vitest (built-in `vi` mock functions)
- **Coverage Tool**: Vitest (built-in v8 coverage)
- **TypeScript Support**: Native (Vitest handles TS directly)

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### End-to-End Tests Only
```bash
npm run test:e2e
```

### With Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Categories

### Unit Tests

#### RabbitAirClient Tests
- Constructor validation and configuration
- Token validation and error handling
- State management (power, speed, quality)
- Resource cleanup

#### RabbitAirAccessory Tests
- Service and characteristic setup
- Characteristic handlers (get/set operations)
- State synchronization
- Error handling and cleanup

#### RabbitAirPlatform Tests
- Platform initialization
- Device discovery and configuration
- Accessory lifecycle management
- Cache management

### Integration Tests

#### Plugin Registration
- Platform registration with Homebridge
- Export validation
- Plugin lifecycle

#### Platform Integration
- Full platform initialization
- Device discovery workflow
- Accessory creation and management
- Error handling integration

### End-to-End Tests

#### Homebridge E2E Flow
- Complete plugin initialization and registration
- Platform and device discovery
- Device communication (with mock server)
- HomeKit service configuration
- Error handling and recovery scenarios
- Resource cleanup and management
- State synchronization validation
- Concurrent operations handling

The E2E tests use a mock UDP server (`MockRabbitAirServer`) that simulates a RabbitAir device, allowing for testing of the complete integration flow without requiring physical hardware.

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['test/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov', 'html'],
			include: ['src/**/*.ts'],
			exclude: ['**/*.d.ts'],
			reportsDirectory: './coverage'
		},
		testTimeout: 10000,
		hookTimeout: 10000
	}
});
```

## Writing Tests

### Basic Test Structure
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Component Name', () => {
	beforeEach(() => {
		// Setup before each test
	});

	afterEach(() => {
		vi.restoreAllMocks(); // Clean up mocks
	});

	describe('method name', () => {
		it('should do something', () => {
			// Test implementation
			expect(result).toBe(expected);
		});
	});
});
```

### Mocking Dependencies
```typescript
import { vi } from 'vitest';

// Mock object methods
const mockLogger = {
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn()
};

// Spy on class methods
vi.spyOn(MyClass.prototype, 'methodName').mockResolvedValue(result);

// Mock implementations
const mockFn = vi.fn().mockImplementation(() => {
	return 'mocked value';
});
```

### Testing Async Code
```typescript
it('should handle async operations', async () => {
	const result = await myAsyncFunction();
	expect(result).toBeDefined();
});

// Testing promises
it('should handle rejections', async () => {
	await expect(myFailingFunction()).rejects.toThrow('Error message');
});
```

### Common Assertions
```typescript
// Value comparisons
expect(value).toBe(5);                    // Strict equality (===)
expect(object).toEqual({ key: 'value' }); // Deep equality
expect(value).toBeTruthy();               // Truthy value
expect(value).toBeNull();                 // Null check
expect(value).toBeDefined();              // Not undefined

// Type checks
expect(value).toBeTypeOf('string');
expect(value).toBeInstanceOf(MyClass);

// Mock assertions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenLastCalledWith('arg');

// Async assertions
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies to test in isolation using `vi.fn()` and `vi.spyOn()`
3. **Coverage**: Aim for high test coverage, especially for critical paths
4. **Cleanup**: Always clean up resources and restore mocks with `vi.restoreAllMocks()` in `afterEach()`
5. **Descriptive Names**: Use clear, descriptive test names that explain what's being tested
6. **Edge Cases**: Test both happy paths and error conditions
7. **Timeouts**: Use test timeout parameter for long-running tests: `it('test', async () => {...}, 15000)`

## Continuous Integration

Tests are run as part of the build process:
```bash
npm run prepublishOnly  # Runs lint + test + build
```

This ensures that all changes are properly tested before publication.