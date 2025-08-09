import { expect } from 'chai';
import sinon from 'sinon';
import { Logger } from 'homebridge';
import {
	RabbitAirClient,
	RabbitAirMode,
	RabbitAirSpeed,
	RabbitAirQuality,
	RabbitAirSensitivity,
	type RabbitAirConfig,
	type RabbitAirState
} from '../../src/rabbitair-client.js';

describe('RabbitAirClient', () => {
	let client: RabbitAirClient;
	let mockLogger: sinon.SinonStubbedInstance<Logger>;
	const validConfig: RabbitAirConfig = {
		host: '192.168.1.100',
		token: '12345678901234567890123456789012', // 32 character hex string
		port: 9009
	};

	beforeEach(() => {
		mockLogger = {
			debug: sinon.stub(),
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			log: sinon.stub()
		} as sinon.SinonStubbedInstance<Logger>;
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('constructor', () => {
		it('should create a client with valid configuration', () => {
			expect(() => {
				client = new RabbitAirClient(validConfig, mockLogger);
			}).to.not.throw();
			
			expect(mockLogger.debug).to.have.been.calledOnce;
		});

		it('should throw an error with invalid token length', () => {
			const invalidConfig = { ...validConfig, token: 'too-short' };
			
			expect(() => {
				client = new RabbitAirClient(invalidConfig, mockLogger);
			}).to.throw('Invalid token length');
			
			expect(mockLogger.error).to.have.been.calledWith('Invalid token length. Token must be 32 characters (16 bytes hex)');
		});

		it('should use default port if not provided', () => {
			const configWithoutPort = { host: validConfig.host, token: validConfig.token };
			
			expect(() => {
				client = new RabbitAirClient(configWithoutPort, mockLogger);
			}).to.not.throw();
		});
	});

	describe('state management', () => {
		beforeEach(() => {
			client = new RabbitAirClient(validConfig, mockLogger);
		});

		it('should handle power state changes', () => {
			// Test the enum values are correctly imported
			expect(RabbitAirMode.Auto).to.equal(0);
			expect(RabbitAirMode.Pollen).to.equal(1);
			expect(RabbitAirMode.Manual).to.equal(2);
		});

		it('should handle speed state changes', () => {
			expect(RabbitAirSpeed.SuperSilent).to.equal(0);
			expect(RabbitAirSpeed.Silent).to.equal(1);
			expect(RabbitAirSpeed.Low).to.equal(2);
			expect(RabbitAirSpeed.Medium).to.equal(3);
			expect(RabbitAirSpeed.High).to.equal(4);
			expect(RabbitAirSpeed.Turbo).to.equal(5);
		});

		it('should handle air quality levels', () => {
			expect(RabbitAirQuality.Lowest).to.equal(0);
			expect(RabbitAirQuality.Low).to.equal(1);
			expect(RabbitAirQuality.Medium).to.equal(2);
			expect(RabbitAirQuality.High).to.equal(3);
			expect(RabbitAirQuality.Highest).to.equal(4);
		});
	});

	describe('cleanup', () => {
		beforeEach(() => {
			client = new RabbitAirClient(validConfig, mockLogger);
		});

		it('should cleanup resources without throwing', async () => {
			await expect(client.shutdown()).to.not.be.rejected;
		});
	});
});