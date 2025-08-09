import { expect } from 'chai';
import sinon from 'sinon';
import { Logger, PlatformAccessory, API, Service, Characteristic } from 'homebridge';
import { RabbitAirAccessory } from '../../src/platformAccessory.js';
import { RabbitAirPlatform } from '../../src/platform.js';
import { RabbitAirClient, RabbitAirMode, RabbitAirSpeed } from '../../src/rabbitair-client.js';

describe('RabbitAirAccessory', () => {
	let accessory: RabbitAirAccessory;
	let mockPlatform: sinon.SinonStubbedInstance<RabbitAirPlatform>;
	let mockPlatformAccessory: sinon.SinonStubbedInstance<PlatformAccessory>;
	let mockService: sinon.SinonStubbedInstance<Service>;
	let mockLogger: sinon.SinonStubbedInstance<Logger>;
	let mockClient: sinon.SinonStubbedInstance<RabbitAirClient>;
	let clientConstructorStub: sinon.SinonStub;

	beforeEach(() => {
		// Mock logger
		mockLogger = {
			debug: sinon.stub(),
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			log: sinon.stub()
		} as sinon.SinonStubbedInstance<Logger>;

		// Mock service
		mockService = {
			setCharacteristic: sinon.stub().returnsThis(),
			getCharacteristic: sinon.stub().returnsThis(),
			onSet: sinon.stub().returnsThis(),
			onGet: sinon.stub().returnsThis(),
			setProps: sinon.stub().returnsThis(),
			updateCharacteristic: sinon.stub().returnsThis()
		} as any;

		// Mock platform accessory
		mockPlatformAccessory = {
			context: {
				device: {
					name: 'Test Air Purifier',
					host: '192.168.1.100',
					token: '12345678901234567890123456789012',
					port: 9009
				}
			},
			getService: sinon.stub().returns(mockService),
			addService: sinon.stub().returns(mockService)
		} as any;

		// Mock platform
		mockPlatform = {
			log: mockLogger,
			Service: { 
				AccessoryInformation: 'AccessoryInformation',
				AirPurifier: 'AirPurifier',
				AirQualitySensor: 'AirQualitySensor'
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
						constructor(public status: number) { super(); }
					},
					HAPStatus: {
						SERVICE_COMMUNICATION_FAILURE: -70402
					}
				}
			} as any
		} as any;

		// Mock RabbitAirClient
		mockClient = sinon.createStubInstance(RabbitAirClient);
		clientConstructorStub = sinon.stub(RabbitAirClient.prototype, 'constructor' as any);
		Object.setPrototypeOf(mockClient, RabbitAirClient.prototype);
	});

	afterEach(() => {
		sinon.restore();
		if (accessory && typeof accessory.cleanup === 'function') {
			accessory.cleanup();
		}
	});

	describe('constructor', () => {
		it('should initialize accessory with valid configuration', () => {
			expect(() => {
				accessory = new RabbitAirAccessory(mockPlatform, mockPlatformAccessory);
			}).to.not.throw();
			
			expect(mockPlatformAccessory.getService).to.have.been.called;
		});

		it('should set up required characteristics', () => {
			accessory = new RabbitAirAccessory(mockPlatform, mockPlatformAccessory);
			
			expect(mockService.getCharacteristic).to.have.been.calledWith('Active');
			expect(mockService.getCharacteristic).to.have.been.calledWith('CurrentAirPurifierState');
			expect(mockService.getCharacteristic).to.have.been.calledWith('TargetAirPurifierState');
			expect(mockService.getCharacteristic).to.have.been.calledWith('RotationSpeed');
		});
	});

	describe('characteristic handlers', () => {
		beforeEach(() => {
			accessory = new RabbitAirAccessory(mockPlatform, mockPlatformAccessory);
		});

		describe('getActive', () => {
			it('should return current active state', async () => {
				const result = await accessory.getActive();
				expect(result).to.be.a('boolean');
				expect(mockLogger.debug).to.have.been.called;
			});
		});

		describe('setActive', () => {
			it('should set active state to true', async () => {
				// Mock the client methods
				sinon.stub(accessory as any, 'client').value({
					setState: sinon.stub().resolves()
				});
				
				await accessory.setActive(true);
				
				// Verify logger was called
				expect(mockLogger.debug).to.have.been.called;
			});

			it('should set active state to false', async () => {
				// Mock the client methods
				sinon.stub(accessory as any, 'client').value({
					setState: sinon.stub().resolves()
				});
				
				await accessory.setActive(false);
				
				// Verify logger was called
				expect(mockLogger.debug).to.have.been.called;
			});
		});

		describe('getRotationSpeed', () => {
			it('should return current rotation speed', async () => {
				const result = await accessory.getRotationSpeed();
				expect(result).to.be.a('number');
			});
		});

		describe('setRotationSpeed', () => {
			it('should set rotation speed', async () => {
				// Mock the client methods
				sinon.stub(accessory as any, 'client').value({
					setState: sinon.stub().resolves()
				});
				const testSpeed = RabbitAirSpeed.Medium;
				
				await accessory.setRotationSpeed(testSpeed);
				
				// Verify logger was called
				expect(mockLogger.debug).to.have.been.called;
			});
		});
	});

	describe('cleanup', () => {
		it('should cleanup resources without throwing', async () => {
			accessory = new RabbitAirAccessory(mockPlatform, mockPlatformAccessory);
			// Mock the client shutdown method
			sinon.stub(accessory as any, 'client').value({
				shutdown: sinon.stub().resolves()
			});
			
			await expect(accessory.cleanup()).to.not.be.rejected;
			expect(mockLogger.debug).to.have.been.called;
		});

		it('should handle cleanup errors gracefully', async () => {
			accessory = new RabbitAirAccessory(mockPlatform, mockPlatformAccessory);
			// Mock the client shutdown method to reject
			sinon.stub(accessory as any, 'client').value({
				shutdown: sinon.stub().rejects(new Error('Cleanup failed'))
			});
			
			await expect(accessory.cleanup()).to.not.be.rejected;
			expect(mockLogger.error).to.have.been.called;
		});
	});
});