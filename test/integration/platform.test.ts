import { expect } from 'chai';
import { API, Characteristic, Logger, PlatformAccessory, Service, type Logging } from 'homebridge';
import sinon from 'sinon';
import { RabbitAirPlatform } from '../../src/platform.js';
import { RabbitAirAccessory } from '../../src/platformAccessory.js';
import { RabbitAirClient } from '../../src/rabbitair-client.js';

describe('Homebridge Platform Integration', () => {
	let platform: RabbitAirPlatform;
	let mockApi: sinon.SinonStubbedInstance<API>;
	let mockLogger: sinon.SinonStubbedInstance<Logging>;
	let mockAccessory: sinon.SinonStubbedInstance<PlatformAccessory>;
	let mockService: sinon.SinonStubbedInstance<Service>;
	let clientStub: sinon.SinonStub;

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
			debug: sinon.stub(),
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			log: sinon.stub()
		} as sinon.SinonStubbedInstance<Logging>;

		mockService = {
			characteristics: [],
			setCharacteristic: sinon.stub().returnsThis(),
			getCharacteristic: sinon.stub().returnsThis(),
			onSet: sinon.stub().returnsThis(),
			onGet: sinon.stub().returnsThis(),
			setProps: sinon.stub().returnsThis(),
			updateCharacteristic: sinon.stub().returnsThis()
		} as any;

		mockAccessory = {
			UUID: 'test-uuid-1234',
			displayName: 'Test Air Purifier',
			context: {
				device: testConfig.devices[0]
			},
			services: [],
			getService: sinon.stub().returns(mockService),
			addService: sinon.stub().callsFake((service) => {
				mockAccessory.services.push(service);
				return service;
			}),
			removeService: sinon.stub()
		} as any;

		mockApi = {
			on: sinon.stub(),
			hap: {
				uuid: {
					generate: sinon.stub().returns('test-uuid-1234')
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
			platformAccessory: sinon.stub().returns(mockAccessory),
			registerPlatformAccessories: sinon.stub(),
			unregisterPlatformAccessories: sinon.stub(),
			updatePlatformAccessories: sinon.stub()
		} as any;

		// Mock RabbitAirClient
		clientStub = sinon.stub(RabbitAirClient.prototype, 'constructor' as any);
		sinon.stub(RabbitAirClient.prototype, 'getState').resolves({
			power: true,
			mode: 0,
			speed: 2,
			quality: 2
		});
		sinon.stub(RabbitAirClient.prototype, 'setState').resolves();
		sinon.stub(RabbitAirClient.prototype, 'shutdown').resolves();
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('full platform lifecycle', () => {
		it('should initialize platform and discover devices', async () => {
			platform = new RabbitAirPlatform(mockLogger, testConfig, mockApi);

			expect(platform).to.be.instanceOf(RabbitAirPlatform);
			expect(mockApi.on).to.have.been.calledWith('didFinishLaunching');

			// Simulate the didFinishLaunching event
			const callback = mockApi.on.getCall(0).args[1];
			callback();

			expect(mockLogger.debug).to.have.been.called;
		});

		it('should create accessories for configured devices', () => {
			platform = new RabbitAirPlatform(mockLogger, testConfig, mockApi);
			platform.discoverDevices();

			expect(mockApi.registerPlatformAccessories).to.have.been.calledOnce;
			expect(mockApi.hap.uuid.generate).to.have.been.called;
		});

		it('should handle cached accessory restoration', () => {
			platform = new RabbitAirPlatform(mockLogger, testConfig, mockApi);

			// Simulate cached accessory
			platform.configureAccessory(mockAccessory);

			expect(platform.accessories.size).to.equal(1);
			expect(platform.accessories.get(mockAccessory.UUID)).to.equal(mockAccessory);
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
			}).to.not.throw();
		});

		it('should setup all required services and characteristics', () => {
			accessory = new RabbitAirAccessory(platform, mockAccessory);

			// Should setup accessory information - hap-fluent calls getService with service constructors
			expect(mockAccessory.getService).to.have.been.calledWith(sinon.match.has('name', 'AccessoryInformation'));

			// Should setup air purifier service
			expect(mockAccessory.getService).to.have.been.calledWith(sinon.match.has('name', 'AirPurifier'));

			// Should setup air quality sensor service
			expect(mockAccessory.getService).to.have.been.calledWith(sinon.match.has('name', 'AirQualitySensor'));

			// Should setup filter maintenance service
			expect(mockAccessory.getService).to.have.been.calledWith(sinon.match.has('name', 'FilterMaintenance'));
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
			clientStub.throws(new Error('Connection failed'));

			expect(() => {
				platform = new RabbitAirPlatform(mockLogger, testConfig, mockApi);
				platform.discoverDevices();
			}).to.not.throw();
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

			expect(mockLogger.error).to.have.been.called;
		});
	});
});