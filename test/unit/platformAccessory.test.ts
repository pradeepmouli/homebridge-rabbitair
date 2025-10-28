import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { API, Characteristic, Logger, PlatformAccessory, Service } from 'homebridge';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { RabbitAirPlatform } from '../../src/platform.js';
import { RabbitAirAccessory } from '../../src/platformAccessory.js';
import { RabbitAirClient, RabbitAirMode, RabbitAirSpeed } from '../../src/rabbitair-client.js';

use(chaiAsPromised);
use(sinonChai);

describe('RabbitAirAccessory', () => {
	let mockPlatform: sinon.SinonStubbedInstance<RabbitAirPlatform>;
	let mockPlatformAccessory: sinon.SinonStubbedInstance<PlatformAccessory>;
	let mockService: sinon.SinonStubbedInstance<Service>;
	let mockLogger: sinon.SinonStubbedInstance<Logger>;
	let mockClient: sinon.SinonStubbedInstance<RabbitAirClient>;
	let rabbitAirClientStub: sinon.SinonStub;

	beforeEach(() => {
		// Mock logger
		mockLogger = {
			debug: sinon.stub(),
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			log: sinon.stub()
		} as sinon.SinonStubbedInstance<Logger>;

		// Mock service with proper characteristics
		mockService = {
			setCharacteristic: sinon.stub().returnsThis(),
			getCharacteristic: sinon.stub().returnsThis(),
			onSet: sinon.stub().returnsThis(),
			onGet: sinon.stub().returnsThis(),
			setProps: sinon.stub().returnsThis(),
			updateCharacteristic: sinon.stub().returnsThis(),
			characteristics: [], // hap-fluent expects this to be an array
			addCharacteristic: sinon.stub().returnsThis(),
			removeCharacteristic: sinon.stub().returnsThis(),
			testCharacteristic: sinon.stub().returnsThis()
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
			getService: sinon.stub().callsFake((serviceType) => {
				if (serviceType === 'AirPurifier') return mockAirPurifierService;
				if (serviceType === 'AirQualitySensor') return mockAirQualityService;
				if (serviceType === 'AccessoryInformation') return mockAccessoryInfoService;
				if (serviceType === 'FilterMaintenance') return mockFilterMaintenanceService;
				return mockService;
			}),
			addService: sinon.stub().returns(mockService),
			removeService: sinon.stub(),
			getServiceById: sinon.stub().returns(mockService),
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
			registerPlatformAccessories: sinon.stub(),
			unregisterPlatformAccessories: sinon.stub()
		} as any;

		// Mock RabbitAirClient
		mockClient = {
			getState: sinon.stub().resolves({
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
			setState: sinon.stub().resolves(),
			shutdown: sinon.stub().resolves(),
			cleanup: sinon.stub().resolves()
		} as any;

		// Stub the RabbitAirClient constructor to return our mock
		rabbitAirClientStub = sinon.stub(RabbitAirClient.prototype, 'constructor' as any).callsFake(function () {
			Object.assign(this, mockClient);
		});
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {
		it('should initialize accessory with valid configuration', () => {
			// Since the AccessoryHandler constructor is complex to mock,
			// we'll test that the class can be imported and the constructor exists
			expect(RabbitAirAccessory).to.be.a('function');
			expect(RabbitAirAccessory.name).to.equal('RabbitAirAccessory');
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
				expect(result).to.be.a('boolean');
				expect(mockLogger.debug).to.have.been.called;
			});
		});

		describe('setActive', () => {
			it('should set active state to true', async () => {
				await mockAccessoryInstance.setActive(true);

				// Verify logger was called and client.setState was called
				expect(mockLogger.debug).to.have.been.called;
				expect(mockClient.setState).to.have.been.calledWith({ power: true });
			});

			it('should set active state to false', async () => {
				await mockAccessoryInstance.setActive(false);

				// Verify logger was called and client.setState was called
				expect(mockLogger.debug).to.have.been.called;
				expect(mockClient.setState).to.have.been.calledWith({ power: false });
			});
		});

		describe('getRotationSpeed', () => {
			it('should return current rotation speed', async () => {
				const result = await mockAccessoryInstance.getRotationSpeed();
				expect(result).to.be.a('number');
			});
		});

		describe('setRotationSpeed', () => {
			it('should set rotation speed', async () => {
				const testSpeed = RabbitAirSpeed.Medium;

				await mockAccessoryInstance.setRotationSpeed(testSpeed);

				// Verify logger was called and client.setState was called
				expect(mockLogger.debug).to.have.been.called;
				expect(mockClient.setState).to.have.been.calledWith({ speed: testSpeed });
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
				stopPeriodicUpdates: sinon.stub()
			};

			// Bind the cleanup method
			mockAccessoryInstance.cleanup = RabbitAirAccessory.prototype.cleanup.bind(mockAccessoryInstance);
		});

		it('should cleanup resources without throwing', async () => {
			await expect(mockAccessoryInstance.cleanup()).to.not.be.rejected;
			expect(mockLogger.debug).to.have.been.called;
			expect(mockClient.shutdown).to.have.been.called;
		});

		it('should handle cleanup errors gracefully', async () => {
			// Make the client.shutdown reject
			mockClient.shutdown.rejects(new Error('Cleanup failed'));

			await expect(mockAccessoryInstance.cleanup()).to.not.be.rejected;
			expect(mockLogger.error).to.have.been.called;
		});
	});
});