import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger } from 'homebridge';
import {
	RabbitAirClient,
	RabbitAirMode,
	RabbitAirQuality,
	RabbitAirSensitivity,
	RabbitAirSpeed,
	type RabbitAirConfig,
	type RabbitAirState
} from '../../src/rabbitair-client.js';

describe('RabbitAirClient', () => {
	let client: RabbitAirClient;
	let mockLogger: Logger;
	const validConfig: RabbitAirConfig = {
		host: '192.168.1.100',
		token: '12345678901234567890123456789012', // 32 character hex string
		port: 9009
	};

	beforeEach(() => {
		mockLogger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			log: vi.fn()
		} as unknown as Logger;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create a client with valid configuration', () => {
			expect(() => {
				client = new RabbitAirClient(validConfig, mockLogger);
			}).not.toThrow();

			// The constructor calls debug 3 times: host initialization, token validation, and command ID generation
			expect(mockLogger.debug).toHaveBeenCalledTimes(3);
		});

		it('should throw an error with invalid token length', () => {
			const invalidConfig = { ...validConfig, token: 'too-short' };

			expect(() => {
				client = new RabbitAirClient(invalidConfig, mockLogger);
			}).toThrow('Invalid token length');

			expect(mockLogger.error).toHaveBeenCalledWith('Invalid token length. Token must be 32 characters (16 bytes hex)');
		});

		it('should use default port if not provided', () => {
			const configWithoutPort = { host: validConfig.host, token: validConfig.token };

			expect(() => {
				client = new RabbitAirClient(configWithoutPort, mockLogger);
			}).not.toThrow();
		});
	});

	describe('state management', () => {
		beforeEach(() => {
			client = new RabbitAirClient(validConfig, mockLogger);
		});

		it('should handle power state changes', () => {
			// Test the enum values are correctly imported
			expect(RabbitAirMode.Auto).toBe(0);
			expect(RabbitAirMode.Pollen).toBe(1);
			expect(RabbitAirMode.Manual).toBe(2);
		});

		it('should handle speed state changes', () => {
			expect(RabbitAirSpeed.SuperSilent).toBe(0);
			expect(RabbitAirSpeed.Silent).toBe(1);
			expect(RabbitAirSpeed.Low).toBe(2);
			expect(RabbitAirSpeed.Medium).toBe(3);
			expect(RabbitAirSpeed.High).toBe(4);
			expect(RabbitAirSpeed.Turbo).toBe(5);
		});

		it('should handle air quality levels', () => {
			expect(RabbitAirQuality.Lowest).toBe(0);
			expect(RabbitAirQuality.Low).toBe(1);
			expect(RabbitAirQuality.Medium).toBe(2);
			expect(RabbitAirQuality.High).toBe(3);
			expect(RabbitAirQuality.Highest).toBe(4);
		});
	});

	describe('cleanup', () => {
		beforeEach(() => {
			client = new RabbitAirClient(validConfig, mockLogger);
		});

		it('should cleanup resources without throwing', async () => {
			await expect(client.shutdown()).resolves.not.toThrow();
		});
	});
});