import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { API, Logger, PlatformAccessory, type Logging } from 'homebridge';
import { RabbitAirPlatform, type RabbitAirPlatformConfig } from '../../src/platform.js';
import { RabbitAirAccessory } from '../../src/platformAccessory.js';
import { RabbitAirClient } from '../../src/rabbitair-client.js';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../src/settings.js';

describe('RabbitAirPlatform', () => {
	let platform: RabbitAirPlatform;
	let mockApi: any;
	let mockLogger: Logging & { prefix: string; };
	let mockAccessory: any;
	let accessoryConstructorStub: any;

	const validConfig: RabbitAirPlatformConfig = {
		platform: PLATFORM_NAME,
		name: 'RabbitAir',
		devices: [
			{
				name: 'Living Room Air Purifier',
				host: '192.168.1.100',
				token: '12345678901234567890123456789012',
				port: 9009
			}
		]
	};

	beforeEach(() => {
		mockLogger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			log: vi.fn(),
			prefix: '<PREFIX>'
		} as Logging & { prefix: string; };

		mockAccessory = {
			UUID: 'test-uuid-1234',
			displayName: 'Test Air Purifier',
			context: {},
			services: [],
			addService: vi.fn(),
			getService: vi.fn(),
			removeService: vi.fn()
		} as any;

		mockApi = {
			on: vi.fn(),
			hap: {
				uuid: {
					generate: vi.fn().mockReturnValue('test-uuid-1234')
				},
				Service: {},
				Characteristic: {}
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

		// Stub the RabbitAirAccessory constructor to prevent actual initialization
		accessoryConstructorStub = vi.spyOn(RabbitAirAccessory.prototype, 'constructor' as any).mockImplementation(() => {
			// Return undefined to allow instantiation to complete
			return undefined as any;
		});

		// Stub RabbitAirClient methods
		vi.spyOn(RabbitAirClient.prototype, 'connect').mockResolvedValue(undefined);
		vi.spyOn(RabbitAirClient.prototype, 'getInfo').mockResolvedValue({ name: 'Test', mac: '00:11:22:33:44:55', model: 'A3' });
		vi.spyOn(RabbitAirClient.prototype, 'getState').mockResolvedValue({ power: true, mode: 0, speed: 2, quality: 2 } as any);
		vi.spyOn(RabbitAirClient.prototype, 'shutdown').mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should initialize platform with valid configuration', () => {
			platform = new RabbitAirPlatform(mockLogger, validConfig, mockApi);
			expect(platform.log).toBe(mockLogger);
			expect(platform.config).toBe(validConfig);
			expect(platform.api).toBe(mockApi);
			expect(mockApi.on).toHaveBeenCalledWith('didFinishLaunching', expect.any(Function));
		});

		it('should set up service and characteristic references', () => {
			platform = new RabbitAirPlatform(mockLogger, validConfig, mockApi);

			expect(platform.Service).toBe(mockApi.hap.Service);
			expect(platform.Characteristic).toBe(mockApi.hap.Characteristic);
		});
	});

	describe('configureAccessory', () => {
		beforeEach(() => {
			platform = new RabbitAirPlatform(mockLogger, validConfig, mockApi);
		});

		it('should add accessory to cache', () => {
			platform.configureAccessory(mockAccessory);

			expect(platform.accessories.get(mockAccessory.UUID)).toBe(mockAccessory);
			expect(mockLogger.info).toHaveBeenCalledWith('Loading accessory from cache:', mockAccessory.displayName);
		});
	});

	describe('discoverDevices', () => {
		beforeEach(() => {
			platform = new RabbitAirPlatform(mockLogger, validConfig, mockApi);
		});

		it('should warn when no devices are configured', () => {
			const configWithoutDevices = { ...validConfig, devices: undefined };
			platform = new RabbitAirPlatform(mockLogger, configWithoutDevices, mockApi);

			platform.discoverDevices();

			expect(mockLogger.warn).toHaveBeenCalledWith('No devices configured. Please add RabbitAir devices to your config.');
		});

		it('should register new accessories for valid device configurations', () => {
			platform.discoverDevices();

			expect(mockApi.hap.uuid.generate).toHaveBeenCalled();
			expect(mockApi.registerPlatformAccessories).toHaveBeenCalledWith(
				PLUGIN_NAME,
				PLATFORM_NAME,
				[mockAccessory]
			);
		});

		it('should restore existing accessories from cache', async () => {
			// Add an accessory to cache first
			const uuid = 'test-uuid-1234';
			platform.accessories.set(uuid, mockAccessory);

			await platform.discoverDevices();

			expect(mockApi.updatePlatformAccessories).toHaveBeenCalledWith([mockAccessory]);
			expect(mockLogger.info).toHaveBeenCalledWith('Restoring existing accessory from cache:', mockAccessory.displayName);
		});

		it('should skip invalid device configurations', () => {
			const invalidConfig = {
				...validConfig,
				devices: [
					{ name: '', host: '', token: '' }, // Invalid
					validConfig.devices![0] // Valid
				]
			};
			platform = new RabbitAirPlatform(mockLogger, invalidConfig, mockApi);

			platform.discoverDevices();

			expect(mockLogger.error).toHaveBeenCalledWith(
				'Invalid device configuration. Name, host, and token are required:',
				{ name: '', host: '', token: '' }
			);
			// Should still process the valid device
			expect(mockApi.registerPlatformAccessories).toHaveBeenCalledOnce();
		});

		it('should remove accessories no longer in config', () => {
			const removedAccessoryUuid = 'removed-uuid';
			const removedAccessory = { ...mockAccessory, UUID: removedAccessoryUuid, displayName: 'Removed Purifier' };

			// Add an accessory that's not in the current config
			platform.accessories.set(removedAccessoryUuid, removedAccessory);

			platform.discoverDevices();

			expect(mockApi.unregisterPlatformAccessories).toHaveBeenCalledWith(
				PLUGIN_NAME,
				PLATFORM_NAME,
				[removedAccessory]
			);
			expect(mockLogger.info).toHaveBeenCalledWith('Removing existing accessory from cache:', removedAccessory.displayName);
		});
	});

	describe('edge cases', () => {
		it('should handle empty devices array', () => {
			const configWithEmptyDevices = { ...validConfig, devices: [] };
			platform = new RabbitAirPlatform(mockLogger, configWithEmptyDevices, mockApi);

			platform.discoverDevices();

			expect(mockLogger.warn).toHaveBeenCalledWith('No devices configured. Please add RabbitAir devices to your config.');
		});

		it('should use default port when not specified', () => {
			const configWithoutPort = {
				...validConfig,
				devices: [{
					name: validConfig.devices![0].name,
					host: validConfig.devices![0].host,
					token: validConfig.devices![0].token
					// port is omitted
				}]
			};
			platform = new RabbitAirPlatform(mockLogger, configWithoutPort, mockApi);

			expect(() => platform.discoverDevices()).not.toThrow();
		});
	});
});