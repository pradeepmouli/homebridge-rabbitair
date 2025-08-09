import { expect } from 'chai';
import sinon from 'sinon';
import { API, Logger, PlatformAccessory } from 'homebridge';
import { RabbitAirPlatform, type RabbitAirPlatformConfig } from '../../src/platform.js';
import { RabbitAirAccessory } from '../../src/platformAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../src/settings.js';

describe('RabbitAirPlatform', () => {
	let platform: RabbitAirPlatform;
	let mockApi: sinon.SinonStubbedInstance<API>;
	let mockLogger: sinon.SinonStubbedInstance<Logger>;
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
			log: sinon.stub()
		} as sinon.SinonStubbedInstance<Logger>;

		mockAccessory = {
			UUID: 'test-uuid-1234',
			displayName: 'Test Air Purifier',
			context: {},
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

		it('should restore existing accessories from cache', () => {
			// Add an accessory to cache first
			const uuid = 'test-uuid-1234';
			platform.accessories.set(uuid, mockAccessory);
			
			platform.discoverDevices();
			
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
});