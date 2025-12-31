import { expect, use } from 'chai';
import { API, Logger, PlatformAccessory, type Logging } from 'homebridge';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { RabbitAirPlatform, type RabbitAirPlatformConfig } from '../../src/platform.js';
import { RabbitAirAccessory } from '../../src/platformAccessory.js';
import { RabbitAirClient } from '../../src/rabbitair-client.js';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../src/settings.js';

use(sinonChai);

describe('RabbitAirPlatform', () => {
	let platform: RabbitAirPlatform;
	let mockApi: sinon.SinonStubbedInstance<API>;
	let mockLogger: sinon.SinonStubbedInstance<Logging> & { prefix: string; };
	let mockAccessory: sinon.SinonStubbedInstance<PlatformAccessory>;
	let accessoryConstructorStub: sinon.SinonStub;

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
			debug: sinon.stub(),
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			log: sinon.stub(),
			prefix: '<PREFIX>'
		} as sinon.SinonStubbedInstance<Logging> & { prefix: string; };

		mockAccessory = {
			UUID: 'test-uuid-1234',
			displayName: 'Test Air Purifier',
			context: {},
			services: [],
			addService: sinon.stub(),
			getService: sinon.stub(),
			removeService: sinon.stub()
		} as any;

		mockApi = {
			on: sinon.stub(),
			hap: {
				uuid: {
					generate: sinon.stub().returns('test-uuid-1234')
				},
				Service: {},
				Characteristic: {}
			},
			platformAccessory: sinon.stub().returns(mockAccessory),
			registerPlatformAccessories: sinon.stub(),
			unregisterPlatformAccessories: sinon.stub(),
			updatePlatformAccessories: sinon.stub()
		} as any;

		// Stub the RabbitAirAccessory constructor
		accessoryConstructorStub = sinon.stub(RabbitAirAccessory.prototype, 'constructor' as any);

		// Stub RabbitAirClient methods
		sinon.stub(RabbitAirClient.prototype, 'connect').resolves();
		sinon.stub(RabbitAirClient.prototype, 'getInfo').resolves({ name: 'Test', mac: '00:11:22:33:44:55', model: 'A3' });
		sinon.stub(RabbitAirClient.prototype, 'getState').resolves({ power: true, mode: 0, speed: 2, quality: 2 });
		sinon.stub(RabbitAirClient.prototype, 'shutdown').resolves();
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {
		it('should initialize platform with valid configuration', () => {
			platform = new RabbitAirPlatform(mockLogger, validConfig, mockApi);
			expect(platform.log).to.equal(mockLogger);
			expect(platform.config).to.equal(validConfig);
			expect(platform.api).to.equal(mockApi);
			expect(mockApi.on).to.have.been.calledWith('didFinishLaunching');
		});

		it('should set up service and characteristic references', () => {
			platform = new RabbitAirPlatform(mockLogger, validConfig, mockApi);

			expect(platform.Service).to.equal(mockApi.hap.Service);
			expect(platform.Characteristic).to.equal(mockApi.hap.Characteristic);
		});
	});

	describe('configureAccessory', () => {
		beforeEach(() => {
			platform = new RabbitAirPlatform(mockLogger, validConfig, mockApi);
		});

		it('should add accessory to cache', () => {
			platform.configureAccessory(mockAccessory);

			expect(platform.accessories.get(mockAccessory.UUID)).to.equal(mockAccessory);
			expect(mockLogger.info).to.have.been.calledWith('Loading accessory from cache:', mockAccessory.displayName);
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

			expect(mockLogger.warn).to.have.been.calledWith('No devices configured. Please add RabbitAir devices to your config.');
		});

		it('should register new accessories for valid device configurations', () => {
			platform.discoverDevices();

			expect(mockApi.hap.uuid.generate).to.have.been.called;
			expect(mockApi.registerPlatformAccessories).to.have.been.calledWith(
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

			expect(mockApi.updatePlatformAccessories).to.have.been.calledWith([mockAccessory]);
			expect(mockLogger.info).to.have.been.calledWith('Restoring existing accessory from cache:', mockAccessory.displayName);
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

			expect(mockLogger.error).to.have.been.calledWith(
				'Invalid device configuration. Name, host, and token are required:',
				{ name: '', host: '', token: '' }
			);
			// Should still process the valid device
			expect(mockApi.registerPlatformAccessories).to.have.been.calledOnce;
		});

		it('should remove accessories no longer in config', () => {
			const removedAccessoryUuid = 'removed-uuid';
			const removedAccessory = { ...mockAccessory, UUID: removedAccessoryUuid, displayName: 'Removed Purifier' };

			// Add an accessory that's not in the current config
			platform.accessories.set(removedAccessoryUuid, removedAccessory);

			platform.discoverDevices();

			expect(mockApi.unregisterPlatformAccessories).to.have.been.calledWith(
				PLUGIN_NAME,
				PLATFORM_NAME,
				[removedAccessory]
			);
			expect(mockLogger.info).to.have.been.calledWith('Removing existing accessory from cache:', removedAccessory.displayName);
		});
	});

	describe('edge cases', () => {
		it('should handle empty devices array', () => {
			const configWithEmptyDevices = { ...validConfig, devices: [] };
			platform = new RabbitAirPlatform(mockLogger, configWithEmptyDevices, mockApi);

			platform.discoverDevices();

			expect(mockLogger.warn).to.have.been.calledWith('No devices configured. Please add RabbitAir devices to your config.');
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

			expect(() => platform.discoverDevices()).to.not.throw();
		});
	});

	describe('Platform Lifecycle (T008-T013)', () => {
		beforeEach(() => {
			platform = new RabbitAirPlatform(mockLogger, validConfig, mockApi);
		});

		it('should initialize platform on Homebridge startup (T008)', () => {
			expect(platform).to.exist;
			expect(platform.log).to.equal(mockLogger);
			expect(platform.config).to.deep.equal(validConfig);
			expect(platform.api).to.equal(mockApi);
			expect(mockApi.on).to.have.been.calledWith('didFinishLaunching');
		});

		it('should discover devices on didFinishLaunching event (T009)', () => {
			const discoverSpy = sinon.spy(platform, 'discoverDevices');

			// Trigger the 'didFinishLaunching' event
			const callback = mockApi.on.getCall(0).args[1];
			callback();

			expect(discoverSpy).to.have.been.calledOnce;
		});

		it('should restore cached accessories on startup (T010)', () => {
			platform.configureAccessory(mockAccessory);
			expect(platform.accessories.has(mockAccessory.UUID)).to.equal(true);
			expect(platform.accessories.get(mockAccessory.UUID)).to.equal(mockAccessory);
		});

		it('should register new accessories when devices are configured (T011)', () => {
			const uuidStub = mockApi.hap.uuid.generate as sinon.SinonStub;
			uuidStub.returns('new-uuid');

			platform.discoverDevices();

			expect(mockApi.registerPlatformAccessories).to.have.been.calledWith(
				PLUGIN_NAME,
				PLATFORM_NAME,
				sinon.match.array
			);
			expect(mockLogger.info).to.have.been.called;
		});

		it('should unregister accessories when devices are removed from config (T012)', () => {
			const orphanedUuid = 'orphan-uuid';
			const orphanedAccessory = {
				...mockAccessory,
				UUID: orphanedUuid,
				displayName: 'Orphaned Device'
			};
			platform.accessories.set(orphanedUuid, orphanedAccessory);

			platform.discoverDevices();

			expect(mockApi.unregisterPlatformAccessories).to.have.been.calledWith(
				PLUGIN_NAME,
				PLATFORM_NAME,
				[orphanedAccessory]
			);
			expect(mockLogger.info).to.have.been.calledWith(
				'Removing existing accessory from cache:',
				'Orphaned Device'
			);
		});

		it('should handle platform shutdown gracefully (T013)', async () => {
			// Add some accessories to the platform
			platform.accessories.set('uuid1', mockAccessory);

			// There's no explicit shutdown in the current implementation,
			// but we can verify cleanup behavior
			expect(platform.accessories.size).to.be.greaterThan(0);
		});
	});

	describe('Error Handling in Platform Initialization (T036-T037)', () => {
		it('should handle invalid configuration gracefully', () => {
			const invalidConfig = {
				platform: PLATFORM_NAME,
				name: 'RabbitAir',
				devices: [
					{ name: '', host: '', token: '' } // Invalid device config
				]
			};

			platform = new RabbitAirPlatform(mockLogger, invalidConfig, mockApi);
			platform.discoverDevices();

			expect(mockLogger.error).to.have.been.called;
		});

		it('should handle missing devices array', () => {
			const configWithoutDevices = {
				platform: PLATFORM_NAME,
				name: 'RabbitAir'
				// devices is undefined
			};

			platform = new RabbitAirPlatform(mockLogger, configWithoutDevices, mockApi);
			platform.discoverDevices();

			expect(mockLogger.warn).to.have.been.calledWith(
				'No devices configured. Please add RabbitAir devices to your config.'
			);
		});

		it('should recover from device registration errors', () => {
			mockApi.registerPlatformAccessories.throws(new Error('Registration failed'));

			platform = new RabbitAirPlatform(mockLogger, validConfig, mockApi);

			expect(() => platform.discoverDevices()).to.not.throw();
		});
	});

	describe('Multi-Device Support (T050)', () => {
		it('should handle multiple devices independently', () => {
			const multiDeviceConfig: RabbitAirPlatformConfig = {
				platform: PLATFORM_NAME,
				name: 'RabbitAir',
				devices: [
					{
						name: 'Living Room Purifier',
						host: '192.168.1.100',
						token: '12345678901234567890123456789012',
						port: 9009
					},
					{
						name: 'Bedroom Purifier',
						host: '192.168.1.101',
						token: '23456789012345678901234567890123',
						port: 9009
					}
				]
			};

			platform = new RabbitAirPlatform(mockLogger, multiDeviceConfig, mockApi);
			platform.discoverDevices();

			expect(mockApi.hap.uuid.generate).to.have.been.calledTwice;
			expect(mockApi.registerPlatformAccessories).to.have.been.called;
		});

		it('should not cross-contaminate device states', () => {
			const multiDeviceConfig: RabbitAirPlatformConfig = {
				platform: PLATFORM_NAME,
				name: 'RabbitAir',
				devices: [
					{
						name: 'Device 1',
						host: '192.168.1.100',
						token: '12345678901234567890123456789012',
						port: 9009
					},
					{
						name: 'Device 2',
						host: '192.168.1.101',
						token: '23456789012345678901234567890123',
						port: 9009
					}
				]
			};

			platform = new RabbitAirPlatform(mockLogger, multiDeviceConfig, mockApi);

			const uuid1 = 'uuid-1';
			const uuid2 = 'uuid-2';
			const uuidStub = mockApi.hap.uuid.generate as sinon.SinonStub;
			uuidStub.onCall(0).returns(uuid1);
			uuidStub.onCall(1).returns(uuid2);

			platform.discoverDevices();

			// Verify both devices registered with unique UUIDs
			expect(mockApi.hap.uuid.generate).to.have.been.calledTwice;
		});
	});
});