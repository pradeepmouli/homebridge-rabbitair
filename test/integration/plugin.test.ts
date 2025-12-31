import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { API } from 'homebridge';
import homebridge from '../../src/index.js';
import { RabbitAirPlatform } from '../../src/platform.js';
import { PLATFORM_NAME } from '../../src/settings.js';

describe('Homebridge Plugin Integration', () => {
	let mockApi: any;

	beforeEach(() => {
		mockApi = {
			registerPlatform: vi.fn(),
			on: vi.fn(),
			hap: {
				Service: {},
				Characteristic: {},
				uuid: {
					generate: vi.fn()
				}
			}
		} as any;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('plugin registration', () => {
		it('should register the RabbitAir platform with homebridge', () => {
			homebridge(mockApi);
			
			expect(mockApi.registerPlatform).toHaveBeenCalledOnce();
			expect(mockApi.registerPlatform).toHaveBeenCalledWith(PLATFORM_NAME, RabbitAirPlatform);
		});

		it('should export a default function', () => {
			expect(homebridge).toBeTypeOf('function');
		});
	});

	describe('platform lifecycle', () => {
		it('should handle platform initialization', () => {
			// This would typically involve more complex setup
			// For now, we verify the platform can be instantiated
			expect(() => homebridge(mockApi)).not.toThrow();
		});
	});
});