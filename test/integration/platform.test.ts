import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { API, Characteristic, Logger, PlatformAccessory, Service, type Logging } from 'homebridge';
import { RabbitAirPlatform } from '../../src/platform.js';
import { RabbitAirAccessory } from '../../src/platformAccessory.js';
import { RabbitAirClient } from '../../src/rabbitair-client.js';

describe('Homebridge Platform Integration', () => {
	let platform: RabbitAirPlatform;
	let mockApi: any;
	let mockLogger: Logging;
	let mockAccessory: any;
	let mockService: any;
	let clientStub: any;

	const testConfig = {
		platform: 'RabbitAir',
		name: 'RabbitAir',
		devices: [
			{
				name: 'Living Room Purifier',
				host: '192.168.1.100',
				token: '12345678901234567890123456789012'
			}
		]
	};

	beforeEach(() => {
		mockLogger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			log: vi.fn()
		} as unknown as Logging;

		mockService = {
			characteristics: [],
			setCharacteristic: vi.fn().mockReturnThis(),
			getCharacteristic: vi.fn().mockReturnThis(),
			onSet: vi.fn().mockReturnThis(),
			onGet: vi.fn().mockReturnThis(),
			setProps: vi.fn().mockReturnThis(),
			updateCharacteristic: vi.fn().mockReturnThis()
		} as any;

		mockAccessory = {
			UUID: 'test-uuid-1234',
			displayName: 'Test Air Purifier',
			context: {
				device: testConfig.devices[0]
			},
			services: [],
			getService: vi.fn().mockReturnValue(mockService),
			addService: vi.fn().mockImplementation((service) => {
				mockAccessory.services.push(service);
				return service;
			}),
			removeService: vi.fn()
		} as any;

		mockApi = {
			on: vi.fn(),
			hap: {
				uuid: {
					generate: vi.fn().mockReturnValue('test-uuid-1234')
				},
				Service: {
					AccessoryInformation: class MockAccessoryInformation {
						characteristics = [];
						constructor () { this.characteristics = []; }
					},
					AirPurifier: class MockAirPurifier {
						characteristics = [];
						constructor () { this.characteristics = []; }
					},
					AirQualitySensor: class MockAirQualitySensor {
						characteristics = [];
						constructor () { this.characteristics = []; }
					},
					FilterMaintenance: class MockFilterMaintenance {
						characteristics = [];
						constructor () { this.characteristics = []; }
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
					constructor (public status: number) { super(); }
				},
				HAPStatus: {
					SERVICE_COMMUNICATION_FAILURE: -70402
				}
			},
			platformAccessory: class {
				constructor() {
					return mockAccessory;
				}
			},
			registerPlatformAccessories: vi.fn(),
			unregisterPlatformAccessories: vi.fn(),
			updatePlatformAccessories: vi.fn()
		} as any;

		// Mock RabbitAirClient
		clientStub = vi.spyOn(RabbitAirClient.prototype, 'constructor' as any).mockImplementation(() => {
			return undefined as any;
		});
		vi.spyOn(RabbitAirClient.prototype, 'getState').mockResolvedValue({
			power: true,
			mode: 0,
			speed: 2,
			quality: 2
		} as any);
		vi.spyOn(RabbitAirClient.prototype, 'setState').mockResolvedValue(undefined);
		vi.spyOn(RabbitAirClient.prototype, 'shutdown').mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('full platform lifecycle', () => {
		it('should initialize platform and discover devices', async () => {
			platform = new RabbitAirPlatform(mockLogger, testConfig, mockApi);

			expect(platform).toBeInstanceOf(RabbitAirPlatform);
			expect(mockApi.on).toHaveBeenCalledWith('didFinishLaunching', expect.any(Function));

			// Simulate the didFinishLaunching event
			const callback = mockApi.on.mock.calls[0][1];
			callback();

			expect(mockLogger.debug).toHaveBeenCalled();
		});

		it('should create accessories for configured devices', () => {
			platform = new RabbitAirPlatform(mockLogger, testConfig, mockApi);
			platform.discoverDevices();

			expect(mockApi.registerPlatformAccessories).toHaveBeenCalledOnce();
			expect(mockApi.hap.uuid.generate).toHaveBeenCalled();
		});

		it('should handle cached accessory restoration', () => {
			platform = new RabbitAirPlatform(mockLogger, testConfig, mockApi);

			// Simulate cached accessory
			platform.configureAccessory(mockAccessory);

			expect(platform.accessories.size).toBe(1);
			expect(platform.accessories.get(mockAccessory.UUID)).toBe(mockAccessory);
		});
	});

	describe('accessory integration', () => {
		let accessory: RabbitAirAccessory;

		beforeEach(() => {
			platform = new RabbitAirPlatform(mockLogger, testConfig, mockApi);
		});

		it('should create accessory instance without errors', () => {
			expect(() => {
				accessory = new RabbitAirAccessory(platform, mockAccessory);
			}).not.toThrow();
		});

		it('should setup all required services and characteristics', () => {
			accessory = new RabbitAirAccessory(platform, mockAccessory);

			// Should setup accessory information - hap-fluent calls getService with service constructors
			expect(mockAccessory.getService).toHaveBeenCalledWith(expect.objectContaining({ name: 'AccessoryInformation' }));

			// Should setup air purifier service
			expect(mockAccessory.getService).toHaveBeenCalledWith(expect.objectContaining({ name: 'AirPurifier' }));

			// Should setup air quality sensor service
			expect(mockAccessory.getService).toHaveBeenCalledWith(expect.objectContaining({ name: 'AirQualitySensor' }));

			// Should setup filter maintenance service
			expect(mockAccessory.getService).toHaveBeenCalledWith(expect.objectContaining({ name: 'FilterMaintenance' }));
		});

		afterEach(async () => {
			if (accessory && accessory.cleanup) {
				await accessory.cleanup();
			}
		});
	});

	describe('error handling integration', () => {
		it('should handle client connection failures gracefully', () => {
			// Mock client to throw on construction
			clientStub.mockImplementation(() => {
				throw new Error('Connection failed');
			});

			expect(() => {
				platform = new RabbitAirPlatform(mockLogger, testConfig, mockApi);
				platform.discoverDevices();
			}).not.toThrow();
		});

		it('should handle invalid configurations gracefully', () => {
			const invalidConfig = {
				...testConfig,
				devices: [
					{
						name: '',
						host: '',
						token: 'invalid'
					}
				]
			};

			platform = new RabbitAirPlatform(mockLogger, invalidConfig, mockApi);
			platform.discoverDevices();

			expect(mockLogger.error).toHaveBeenCalled();
		});
	});
});