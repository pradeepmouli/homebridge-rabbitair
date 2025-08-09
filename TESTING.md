# Testing

This project includes comprehensive unit and integration tests to ensure the reliability and correctness of the RabbitAir Homebridge plugin.

## Test Structure

```
test/
├── fixtures/          # Mock data and test utilities
│   └── mockData.ts    # Common test data and mock objects
├── integration/       # Integration tests
│   ├── platform.test.ts   # Platform lifecycle tests
│   └── plugin.test.ts     # Plugin registration tests
└── unit/             # Unit tests
    ├── enums.test.ts           # Enum value tests
    ├── platform.test.ts       # RabbitAirPlatform tests
    ├── platformAccessory.test.ts # RabbitAirAccessory tests
    └── rabbitair-client.test.ts   # RabbitAirClient tests
```

## Test Framework

- **Test Runner**: Mocha
- **Assertion Library**: Chai
- **Mocking Library**: Sinon
- **Coverage Tool**: c8
- **TypeScript Support**: tsx

## Running Tests

### All Tests
```bash
pnpm test
```

### Unit Tests Only
```bash
pnpm test:unit
```

### Integration Tests Only
```bash
pnpm test:integration
```

### With Coverage Report
```bash
pnpm test:coverage
```

### Watch Mode
```bash
pnpm test:watch
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

## Test Configuration

### Mocha Configuration (`.mocharc.json`)
```json
{
	"recursive": true,
	"timeout": 5000,
	"exit": true
}
```

### Coverage Configuration (`.c8rc.json`)
```json
{
	"all": true,
	"include": ["src/**/*.ts"],
	"exclude": ["**/*.d.ts"],
	"reporter": ["text", "lcov", "html"],
	"reportsDir": "coverage"
}
```

## Writing Tests

### Basic Test Structure
```typescript
import { expect } from 'chai';
import sinon from 'sinon';

describe('Component Name', () => {
	beforeEach(() => {
		// Setup before each test
	});

	afterEach(() => {
		sinon.restore(); // Clean up stubs/spies
	});

	describe('method name', () => {
		it('should do something', () => {
			// Test implementation
			expect(result).to.equal(expected);
		});
	});
});
```

### Mocking Dependencies
```typescript
import sinon from 'sinon';

// Mock object methods
const mockLogger = {
	debug: sinon.stub(),
	info: sinon.stub(),
	warn: sinon.stub(),
	error: sinon.stub()
};

// Stub class constructor
sinon.stub(MyClass.prototype, 'constructor' as any);
```

### Testing Async Code
```typescript
it('should handle async operations', async () => {
	const result = await myAsyncFunction();
	expect(result).to.exist;
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies to test in isolation
3. **Coverage**: Aim for high test coverage, especially for critical paths
4. **Cleanup**: Always clean up resources and restore stubs after tests
5. **Descriptive Names**: Use clear, descriptive test names that explain what's being tested
6. **Edge Cases**: Test both happy paths and error conditions

## Continuous Integration

Tests are run as part of the build process:
```bash
npm run prepublishOnly  # Runs lint + test + build
```

This ensures that all changes are properly tested before publication.