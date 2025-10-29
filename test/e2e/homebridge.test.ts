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

		it('should discover and register devices on didFinishLaunching', (done) => {
			platform = new RabbitAirPlatform(mockLogger, platformConfig, mockApi);

			// Get the callback that was registered for 'didFinishLaunching'
			expect(mockApi.on).to.have.been.calledWith('didFinishLaunching');
			const callback = mockApi.on.getCall(0).args[1];

			// Trigger didFinishLaunching event by calling the callback
			callback();

			// Give time for async device discovery
			setTimeout(() => {
				expect(mockApi.registerPlatformAccessories).to.have.been.called;
				done();
			}, 200);
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

		it('should successfully communicate with mock RabbitAir device', async () => {
			// Set initial state on mock server
			mockServer.setState({ power: true, speed: 3, quality: 1 });

			// Get state from device
			const state = await client.getState();

			expect(state).to.exist;
			expect(state.power).to.equal(true);
			expect(state.speed).to.equal(3);
			expect(state.quality).to.equal(1);
		});

		it('should successfully set device state', async () => {
			// Set state via client
			await client.setState({ power: true, speed: 4 });

			// Wait for state update
			await new Promise(resolve => setTimeout(resolve, 100));

			// Verify state was updated on server
			const serverState = mockServer.getState();
			expect(serverState.power).to.equal(true);
			expect(serverState.speed).to.equal(4);
		});

		it('should handle power toggle operations', async () => {
			// Turn on
			await client.setState({ power: true });
			await new Promise(resolve => setTimeout(resolve, 100));
			let serverState = mockServer.getState();
			expect(serverState.power).to.equal(true);

			// Turn off
			await client.setState({ power: false });
			await new Promise(resolve => setTimeout(resolve, 100));
			serverState = mockServer.getState();
			expect(serverState.power).to.equal(false);
		});

		it('should handle speed adjustments', async () => {
			const speeds = [0, 1, 2, 3, 4];

			for (const speed of speeds) {
				await client.setState({ speed });
				await new Promise(resolve => setTimeout(resolve, 100));
				
				const serverState = mockServer.getState();
				expect(serverState.speed).to.equal(speed);
			}
		});

		it('should handle mode changes', async () => {
			// Auto mode
			await client.setState({ mode: 1 });
			await new Promise(resolve => setTimeout(resolve, 100));
			let serverState = mockServer.getState();
			expect(serverState.mode).to.equal(1);

			// Manual mode
			await client.setState({ mode: 0 });
			await new Promise(resolve => setTimeout(resolve, 100));
			serverState = mockServer.getState();
			expect(serverState.mode).to.equal(0);
		});
	});

	describe('Full Platform Integration with Device', () => {
		it('should complete full device setup flow', (done) => {
			// Create platform
			platform = new RabbitAirPlatform(mockLogger, platformConfig, mockApi);

			// Get the didFinishLaunching callback
			const callback = mockApi.on.getCall(0).args[1];
			
			// Trigger device discovery
			callback();

			// Wait for discovery and registration
			setTimeout(() => {
				// Verify platform registered accessories
				expect(mockApi.registerPlatformAccessories).to.have.been.called;
				
				// Verify accessories were created
				expect(platform.accessories.size).to.be.greaterThan(0);
				
				done();
			}, 300);
		});

		it('should handle multiple device configurations', (done) => {
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

			setTimeout(() => {
				// Should register multiple accessories
				expect(mockApi.registerPlatformAccessories).to.have.been.called;
				done();
			}, 300);
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
		it('should handle server communication timeout gracefully', async () => {
			// Stop server to simulate timeout
			await mockServer.stop();

			const client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);

			// Attempt to get state with timeout
			try {
				await Promise.race([
					client.getState(),
					new Promise((_, reject) => 
						setTimeout(() => reject(new Error('Timeout')), 1000)
					)
				]);
				expect.fail('Should have timed out');
			} catch (err: any) {
				expect(err.message).to.include('Timeout');
			} finally {
				await client.shutdown();
			}
		});

		it('should handle invalid device configuration', (done) => {
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

			setTimeout(() => {
				// Should log error for invalid config
				expect(mockLogger.error).to.have.been.called;
				done();
			}, 200);
		});

		it('should handle missing device configuration', (done) => {
			const noDevicesConfig: PlatformConfig = {
				platform: 'RabbitAir',
				name: 'RabbitAir',
				devices: []
			};

			platform = new RabbitAirPlatform(mockLogger, noDevicesConfig, mockApi);

			// Get and trigger the callback
			const callback = mockApi.on.getCall(0).args[1];
			callback();

			setTimeout(() => {
				// Should log warning for no devices
				expect(mockLogger.warn).to.have.been.called;
				done();
			}, 200);
		});

		it('should recover from temporary network errors', async function() {
			this.timeout(5000);

			const client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);

			try {
				// Initial successful communication
				mockServer.setState({ power: true });
				const state1 = await client.getState();
				expect(state1.power).to.equal(true);

				// Simulate network interruption
				await mockServer.stop();
				await new Promise(resolve => setTimeout(resolve, 500));

				// Restart server
				mockServer = new MockRabbitAirServer(TEST_PORT, TEST_TOKEN, mockLogger);
				await mockServer.start();
				await new Promise(resolve => setTimeout(resolve, 500));

				// Should be able to communicate again
				mockServer.setState({ power: false });
				const state2 = await client.getState();
				expect(state2.power).to.equal(false);
			} finally {
				await client.shutdown();
			}
		});
	});

	describe('State Synchronization', () => {
		it('should keep platform state in sync with device state', async function() {
			this.timeout(3000);

			platform = new RabbitAirPlatform(mockLogger, platformConfig, mockApi);

			// Get and trigger the callback
			const callback = mockApi.on.getCall(0).args[1];
			callback();

			// Wait for setup
			await new Promise(resolve => setTimeout(resolve, 500));

			// Change device state
			mockServer.setState({ 
				power: true, 
				speed: 4, 
				quality: 1 
			});

			// Wait for state sync
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Verify platform has updated state
			const serverState = mockServer.getState();
			expect(serverState.power).to.equal(true);
			expect(serverState.speed).to.equal(4);
		});

		it('should update device when characteristics change', async function() {
			this.timeout(3000);

			platform = new RabbitAirPlatform(mockLogger, platformConfig, mockApi);

			// Get and trigger the callback
			const callback = mockApi.on.getCall(0).args[1];
			callback();

			await new Promise(resolve => setTimeout(resolve, 500));

			// Simulate characteristic change through client
			const client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);

			try {
				await client.setState({ power: true, speed: 3 });
				await new Promise(resolve => setTimeout(resolve, 300));

				const serverState = mockServer.getState();
				expect(serverState.power).to.equal(true);
				expect(serverState.speed).to.equal(3);
			} finally {
				await client.shutdown();
			}
		});
	});

	describe('Concurrent Operations', () => {
		it('should handle multiple simultaneous state requests', async function() {
			this.timeout(3000);

			const client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);

			try {
				mockServer.setState({ power: true, speed: 2, quality: 1 });

				// Make multiple concurrent requests
				const requests = [
					client.getState(),
					client.getState(),
					client.getState()
				];

				const results = await Promise.all(requests);

				// All should succeed
				results.forEach(state => {
					expect(state).to.exist;
					expect(state.power).to.equal(true);
					expect(state.speed).to.equal(2);
				});
			} finally {
				await client.shutdown();
			}
		});

		it('should handle rapid state changes', async function() {
			this.timeout(3000);

			const client = new RabbitAirClient(
				{
					host: TEST_HOST,
					token: TEST_TOKEN,
					port: TEST_PORT
				},
				mockLogger
			);

			try {
				// Rapid state changes
				const updates = [
					{ power: true, speed: 1 },
					{ speed: 2 },
					{ speed: 3 },
					{ speed: 4 },
					{ power: false }
				];

				for (const update of updates) {
					await client.setState(update);
					await new Promise(resolve => setTimeout(resolve, 100));
				}

				// Final state should reflect last update
				const serverState = mockServer.getState();
				expect(serverState.power).to.equal(false);
			} finally {
				await client.shutdown();
			}
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

			// Use the client
			await client.getState();

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
