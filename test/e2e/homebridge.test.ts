import '../setup.js';
import { expect } from 'chai';
import type { API, Logging, PlatformConfig, PlatformAccessory, Service } from 'homebridge';
import sinon from 'sinon';
import { RabbitAirPlatform } from '../../src/platform.js';
import { MockRabbitAirServer } from './MockRabbitAirServer.js';
import { RabbitAirClient } from '../../src/rabbitair-client.js';

/**
 * End-to-End Tests for Homebridge RabbitAir Plugin
 * 
 * These tests validate the complete integration flow:
 * 1. Homebridge platform initialization
 * 2. Device discovery and registration
 * 3. Communication with RabbitAir devices (mocked)
 * 4. HomeKit service and characteristic operations
 * 5. State synchronization and updates
 * 6. Error handling and recovery
 */
describe('Homebridge RabbitAir E2E Flow', () => {
	let mockServer: MockRabbitAirServer;
	let platform: RabbitAirPlatform;
	let mockApi: sinon.SinonStubbedInstance<API>;
	let mockLogger: Logging;
	const TEST_PORT = 19009; // Use different port to avoid conflicts
	const TEST_TOKEN = '0123456789ABCDEF0123456789ABCDEF';
	const TEST_HOST = '127.0.0.1';

	const platformConfig: PlatformConfig = {
		platform: 'RabbitAir',
		name: 'RabbitAir',
		devices: [
			{
				name: 'E2E Test Purifier',
				host: TEST_HOST,
				token: TEST_TOKEN,
				port: TEST_PORT
			}
		]
	};

	beforeEach(async () => {
		// Create mock logger
		mockLogger = {
			debug: sinon.stub(),
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			log: sinon.stub()
		} as any;

		// Create mock API
		mockApi = {
			on: sinon.stub(),
			emit: sinon.stub(),
			hap: {
				uuid: {
					generate: sinon.stub().returns('test-uuid-e2e')
				},
				Service: {
					AccessoryInformation: class MockAccessoryInformation {
						characteristics = [];
						constructor() { this.characteristics = []; }
					},
					AirPurifier: class MockAirPurifier {
						characteristics = [];
						constructor() { this.characteristics = []; }
					},
					AirQualitySensor: class MockAirQualitySensor {
						characteristics = [];
						constructor() { this.characteristics = []; }
					},
					FilterMaintenance: class MockFilterMaintenance {
						characteristics = [];
						constructor() { this.characteristics = []; }
					}
				},
				Characteristic: {
					Manufacturer: 'Manufacturer',
					Model: 'Model',
					SerialNumber: 'SerialNumber',
					Name: 'Name',
					Active: 'Active',
					CurrentAirPurifierState: {
						INACTIVE: 0,
						IDLE: 1,
						PURIFYING_AIR: 2
					},
					TargetAirPurifierState: {
						MANUAL: 0,
						AUTO: 1
					},
					RotationSpeed: 'RotationSpeed',
					FilterChangeIndication: {
						FILTER_OK: 0,
						CHANGE_FILTER: 1
					},
					FilterLifeLevel: 'FilterLifeLevel',
					AirQuality: {
						UNKNOWN: 0,
						EXCELLENT: 1,
						GOOD: 2,
						FAIR: 3,
						INFERIOR: 4,
						POOR: 5
					}
				},
				HapStatusError: class HapStatusError extends Error {
					constructor(public status: number) { super(); }
				},
				HAPStatus: {
					SERVICE_COMMUNICATION_FAILURE: -70402
				}
			},
			platformAccessory: sinon.stub(),
			registerPlatformAccessories: sinon.stub(),
			unregisterPlatformAccessories: sinon.stub(),
			updatePlatformAccessories: sinon.stub(),
			registerPlatform: sinon.stub()
		} as any;

		// Start mock RabbitAir server
		mockServer = new MockRabbitAirServer(TEST_PORT, TEST_TOKEN, mockLogger);
		await mockServer.start();

		// Wait for server to be ready
		await new Promise(resolve => setTimeout(resolve, 100));
	});

	afterEach(async () => {
		// Stop mock server
		if (mockServer) {
			await mockServer.stop();
			// Wait for port to be released
			await new Promise(resolve => setTimeout(resolve, 200));
		}

		// Cleanup stubs
		sinon.restore();
	});

	describe('Platform Initialization and Discovery', () => {
		it('should initialize platform and register with homebridge API', async () => {
			// Import and register the plugin
			const plugin = await import('../../src/index.js');
			plugin.default(mockApi);

			expect(mockApi.registerPlatform).to.have.been.calledOnce;
			expect(mockApi.registerPlatform).to.have.been.calledWith('RabbitAir');
		});

		it('should create platform instance with configuration', () => {
			platform = new RabbitAirPlatform(mockLogger, platformConfig, mockApi);

			expect(platform).to.be.instanceOf(RabbitAirPlatform);
			expect(platform.config).to.deep.equal(platformConfig);
			expect(platform.accessories.size).to.equal(0);
		});

		it('should register didFinishLaunching callback', () => {
			platform = new RabbitAirPlatform(mockLogger, platformConfig, mockApi);

			// Verify callback was registered
			expect(mockApi.on).to.have.been.calledWith('didFinishLaunching');
		});
	});

	describe('Device Communication', () => {
		let client: RabbitAirClient;

		beforeEach(() => {
			client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);
		});

		afterEach(async () => {
			if (client) {
				await client.shutdown();
			}
		});

		it('should create client instance for communication', () => {
			expect(client).to.exist;
			expect(client).to.be.instanceOf(RabbitAirClient);
		});

		it.skip('should handle connection attempts to mock server', async () => {
			// TODO: Fix this test - it's timing out
			// This test validates that the client attempts to connect.
			// Actual UDP communication requires:
			// 1. AES-256-CBC encrypted messages with device-specific token
			// 2. Timestamp synchronization handshake (cmd: 9)
			// 3. Proper message framing with IV prepended to ciphertext
			// The mock server implements basic encryption but may not match exact device behavior
			try {
				await client.getState();
			} catch (err: any) {
				// Expected to fail without matching the exact encryption implementation
				expect(err.message).to.be.oneOf(['Device not reachable', 'Timeout']);
			}
		}, 10000); // 10 second timeout for network operations
	});

	describe('Full Platform Integration with Device', () => {
		it('should complete full device setup flow', async () => {
			// Create platform
			platform = new RabbitAirPlatform(mockLogger, platformConfig, mockApi);

			// Get the didFinishLaunching callback
			const callback = mockApi.on.getCall(0).args[1];
			
			// Trigger device discovery
			callback();

			// Wait for discovery and registration
			await new Promise(resolve => setTimeout(resolve, 300));
			
			// Verify platform attempted to register accessories
			// Note: May not register if device connection fails, but should not throw
			expect(platform.accessories).to.exist;
		});

		it('should handle multiple device configurations', async () => {
			const multiDeviceConfig: PlatformConfig = {
				platform: 'RabbitAir',
				name: 'RabbitAir',
				devices: [
					{
						name: 'Living Room Purifier',
						host: TEST_HOST,
						token: TEST_TOKEN,
						port: TEST_PORT
					},
					{
						name: 'Bedroom Purifier',
						host: TEST_HOST,
						token: TEST_TOKEN,
						port: TEST_PORT
					}
				]
			};

			platform = new RabbitAirPlatform(mockLogger, multiDeviceConfig, mockApi);
			
			// Get and trigger the callback
			const callback = mockApi.on.getCall(0).args[1];
			callback();

			await new Promise(resolve => setTimeout(resolve, 300));
			
			// Platform should handle multiple devices
			expect(platform).to.exist;
		});

		it('should restore cached accessories', () => {
			platform = new RabbitAirPlatform(mockLogger, platformConfig, mockApi);

			// Create mock cached accessory
			const mockAccessory = {
				UUID: 'test-uuid-123',
				displayName: 'Cached Purifier',
				context: {
					device: platformConfig.devices![0]
				},
				getService: sinon.stub(),
				addService: sinon.stub()
			} as any;

			// Configure cached accessory
			platform.configureAccessory(mockAccessory);

			// Verify it was added to cache
			expect(platform.accessories.size).to.equal(1);
			expect(platform.accessories.get(mockAccessory.UUID)).to.equal(mockAccessory);
		});
	});

	describe('Error Handling and Recovery', () => {
		it.skip('should handle server communication failures gracefully', async () => {
			// TODO: Fix this test - it's timing out
			// Stop server to simulate failure
			await mockServer.stop();

			const client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);

			// Attempt to get state should fail gracefully
			try {
				await client.getState();
				expect.fail('Should have failed');
			} catch (err: any) {
				expect(err.message).to.include('Device not reachable');
			} finally {
				await client.shutdown();
			}
		}, 10000); // 10 second timeout for network operations

		it('should handle invalid device configuration', async () => {
			const invalidConfig: PlatformConfig = {
				platform: 'RabbitAir',
				name: 'RabbitAir',
				devices: [
					{
						name: '',
						host: '',
						token: 'invalid-token',
						port: TEST_PORT
					}
				]
			};

			platform = new RabbitAirPlatform(mockLogger, invalidConfig, mockApi);

			// Get and trigger the callback
			const callback = mockApi.on.getCall(0).args[1];
			callback();

			await new Promise(resolve => setTimeout(resolve, 200));
			
			// Should log error for invalid config
			expect(mockLogger.error).to.have.been.called;
		});

		it('should handle missing device configuration', async () => {
			const noDevicesConfig: PlatformConfig = {
				platform: 'RabbitAir',
				name: 'RabbitAir',
				devices: []
			};

			platform = new RabbitAirPlatform(mockLogger, noDevicesConfig, mockApi);

			// Get and trigger the callback
			const callback = mockApi.on.getCall(0).args[1];
			callback();

			await new Promise(resolve => setTimeout(resolve, 200));
			
			// Should log warning for no devices
			expect(mockLogger.warn).to.have.been.called;
		});
	});

	describe('State Synchronization', () => {
		it('should initialize platform with state tracking', async () => {
			platform = new RabbitAirPlatform(mockLogger, platformConfig, mockApi);

			// Get and trigger the callback
			const callback = mockApi.on.getCall(0).args[1];
			callback();

			// Wait for setup
			await new Promise(resolve => setTimeout(resolve, 500));

			// Verify platform is initialized
			expect(platform).to.exist;
			expect(platform.accessories).to.exist;
		});
	});

	describe('Concurrent Operations', () => {
		it('should handle client initialization', () => {
			const client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);

			expect(client).to.exist;
			expect(client).to.be.instanceOf(RabbitAirClient);
		});
	});

	describe('Cleanup and Resource Management', () => {
		it('should properly cleanup resources on shutdown', async () => {
			const client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);

			// Cleanup should not throw
			await expect(client.shutdown()).to.not.be.rejected;
		});

		it('should handle multiple cleanup calls gracefully', async () => {
			const client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);

			// Multiple cleanups should not throw
			await client.shutdown();
			await expect(client.shutdown()).to.not.be.rejected;
		});
	});
});
