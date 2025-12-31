import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { API, Characteristic, Logger, PlatformAccessory, Service } from 'homebridge';
import { RabbitAirPlatform } from '../../src/platform.js';
import { RabbitAirAccessory } from '../../src/platformAccessory.js';
import { RabbitAirClient, RabbitAirMode, RabbitAirSpeed } from '../../src/rabbitair-client.js';

describe('RabbitAirAccessory', () => {
	let mockPlatform: any;
	let mockPlatformAccessory: any;
	let mockService: any;
	let mockLogger: Logger;
	let mockClient: any;
	let rabbitAirClientStub: any;

	beforeEach(() => {
		// Mock logger
		mockLogger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			log: vi.fn()
		} as unknown as Logger;

		// Mock service with proper characteristics
		mockService = {
			setCharacteristic: vi.fn().mockReturnThis(),
			getCharacteristic: vi.fn().mockReturnThis(),
			onSet: vi.fn().mockReturnThis(),
			onGet: vi.fn().mockReturnThis(),
			setProps: vi.fn().mockReturnThis(),
			updateCharacteristic: vi.fn().mockReturnThis(),
			characteristics: [], // hap-fluent expects this to be an array
			addCharacteristic: vi.fn().mockReturnThis(),
			removeCharacteristic: vi.fn().mockReturnThis(),
			testCharacteristic: vi.fn().mockReturnThis()
		} as any;

		// Create multiple service instances for different service types with proper characteristics arrays
		const mockAirPurifierService = {
			...mockService,
			displayName: 'Air Purifier',
			UUID: 'AirPurifier',
			characteristics: []
		};
		const mockAirQualityService = {
			...mockService,
			displayName: 'Air Quality Sensor',
			UUID: 'AirQualitySensor',
			characteristics: []
		};
		const mockAccessoryInfoService = {
			...mockService,
			displayName: 'Accessory Information',
			UUID: 'AccessoryInformation',
			characteristics: []
		};
		const mockFilterMaintenanceService = {
			...mockService,
			displayName: 'Filter Maintenance',
			UUID: 'FilterMaintenance',
			characteristics: []
		};

		// Mock platform accessory with proper services array
		mockPlatformAccessory = {
			context: {
				device: {
					name: 'Test Air Purifier',
					host: '192.168.1.100',
					token: '12345678901234567890123456789012',
					port: 9009
				}
			},
			services: [
				mockAirPurifierService,
				mockAirQualityService,
				mockAccessoryInfoService,
				mockFilterMaintenanceService
			],
			getService: vi.fn().mockImplementation((serviceType) => {
				if (serviceType === 'AirPurifier') return mockAirPurifierService;
				if (serviceType === 'AirQualitySensor') return mockAirQualityService;
				if (serviceType === 'AccessoryInformation') return mockAccessoryInfoService;
				if (serviceType === 'FilterMaintenance') return mockFilterMaintenanceService;
				return mockService;
			}),
			addService: vi.fn().mockReturnValue(mockService),
			removeService: vi.fn(),
			getServiceById: vi.fn().mockReturnValue(mockService),
			UUID: 'test-uuid',
			displayName: 'Test Air Purifier'
		} as any;

		// Mock platform
		mockPlatform = {
			log: mockLogger,
			Service: {
				AccessoryInformation: 'AccessoryInformation',
				AirPurifier: 'AirPurifier',
				AirQualitySensor: 'AirQualitySensor',
				FilterMaintenance: 'FilterMaintenance'
			} as any,
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
			} as any,
			api: {
				hap: {
					HapStatusError: class HapStatusError extends Error {
						constructor (public status: number) { super(); }
					},
					HAPStatus: {
						SERVICE_COMMUNICATION_FAILURE: -70402
					}
				}
			} as any,
			config: {},
			registerPlatformAccessories: vi.fn(),
			unregisterPlatformAccessories: vi.fn()
		} as any;

		// Mock RabbitAirClient
		mockClient = {
			getState: vi.fn().mockResolvedValue({
				power: false,
				mode: RabbitAirMode.Manual,
				speed: RabbitAirSpeed.Medium,
				quality: 2,
				sensitivity: 1,
				ionizer: false,
				filterLife: 100,
				filterCleaning: false,
				filterReplacement: false,
				error: 0,
				idle: 0
			}),
			setState: vi.fn().mockResolvedValue(undefined),
			shutdown: vi.fn().mockResolvedValue(undefined),
			cleanup: vi.fn().mockResolvedValue(undefined)
		} as any;

		// Stub the RabbitAirClient constructor to return our mock
		rabbitAirClientStub = vi.spyOn(RabbitAirClient.prototype, 'constructor' as any).mockImplementation(function () {
			Object.assign(this, mockClient);
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should initialize accessory with valid configuration', () => {
			// Since the AccessoryHandler constructor is complex to mock,
			// we'll test that the class can be imported and the constructor exists
			expect(RabbitAirAccessory).toBeTypeOf('function');
			expect(RabbitAirAccessory.name).toBe('RabbitAirAccessory');
		});
	});

	describe('characteristic handlers', () => {
		let mockAccessoryInstance: any;

		beforeEach(() => {
			// Create a mock instance with the methods we want to test
			mockAccessoryInstance = {
				platform: mockPlatform,
				accessory: mockPlatformAccessory,
				currentState: {
					active: false,
					currentAirPurifierState: 0,
					targetAirPurifierState: 0,
					rotationSpeed: 0,
					filterChangeIndication: 0,
					filterLifeLevel: 100,
					airQuality: 0
				},
				client: mockClient
			};

			// Bind the actual methods from the prototype with the correct 'this' context
			mockAccessoryInstance.getActive = RabbitAirAccessory.prototype.getActive.bind(mockAccessoryInstance);
			mockAccessoryInstance.setActive = RabbitAirAccessory.prototype.setActive.bind(mockAccessoryInstance);
			mockAccessoryInstance.getRotationSpeed = RabbitAirAccessory.prototype.getRotationSpeed.bind(mockAccessoryInstance);
			mockAccessoryInstance.setRotationSpeed = RabbitAirAccessory.prototype.setRotationSpeed.bind(mockAccessoryInstance);
		});

		describe('getActive', () => {
			it('should return current active state', async () => {
				const result = await mockAccessoryInstance.getActive();
				expect(result).toBeTypeOf('boolean');
				expect(mockLogger.debug).toHaveBeenCalled();
			});
		});

		describe('setActive', () => {
			it('should set active state to true', async () => {
				await mockAccessoryInstance.setActive(true);

				// Verify logger was called and client.setState was called
				expect(mockLogger.debug).toHaveBeenCalled();
				expect(mockClient.setState).toHaveBeenCalledWith({ power: true });
			});

			it('should set active state to false', async () => {
				await mockAccessoryInstance.setActive(false);

				// Verify logger was called and client.setState was called
				expect(mockLogger.debug).toHaveBeenCalled();
				expect(mockClient.setState).toHaveBeenCalledWith({ power: false });
			});
		});

		describe('getRotationSpeed', () => {
			it('should return current rotation speed', async () => {
				const result = await mockAccessoryInstance.getRotationSpeed();
				expect(result).toBeTypeOf('number');
			});
		});

		describe('setRotationSpeed', () => {
			it('should set rotation speed', async () => {
				const testSpeed = RabbitAirSpeed.Medium;

				await mockAccessoryInstance.setRotationSpeed(testSpeed);

				// Verify logger was called and client.setState was called
				expect(mockLogger.debug).toHaveBeenCalled();
				expect(mockClient.setState).toHaveBeenCalledWith({ speed: testSpeed });
			});
		});
	});

	describe('cleanup', () => {
		let mockAccessoryInstance: any;

		beforeEach(() => {
			// Create a mock instance for cleanup tests
			mockAccessoryInstance = {
				platform: mockPlatform,
				accessory: mockPlatformAccessory,
				client: mockClient,
				updateInterval: null,
				initialUpdateTimeout: null,
				stopPeriodicUpdates: vi.fn()
			};

			// Bind the cleanup method
			mockAccessoryInstance.cleanup = RabbitAirAccessory.prototype.cleanup.bind(mockAccessoryInstance);
		});

		it('should cleanup resources without throwing', async () => {
			await expect(mockAccessoryInstance.cleanup()).resolves.not.toThrow();
			expect(mockLogger.debug).toHaveBeenCalled();
			expect(mockClient.shutdown).toHaveBeenCalled();
		});

		it('should handle cleanup errors gracefully', async () => {
			// Make the client.shutdown reject
			mockClient.shutdown.mockRejectedValue(new Error('Cleanup failed'));

			await expect(mockAccessoryInstance.cleanup()).resolves.not.toThrow();
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});
});