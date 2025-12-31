import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import sinon from 'sinon';
import { API } from 'homebridge';
import homebridge from '../../src/index.js';
import { RabbitAirPlatform } from '../../src/platform.js';
import { PLATFORM_NAME } from '../../src/settings.js';

describe('Homebridge Plugin Integration', () => {
	let mockApi: sinon.SinonStubbedInstance<API>;

	beforeEach(() => {
		mockApi = {
			registerPlatform: sinon.stub(),
			on: sinon.stub(),
			hap: {
				Service: {},
				Characteristic: {},
				uuid: {
					generate: sinon.stub()
				}
			}
		} as any;
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('plugin registration', () => {
		it('should register the RabbitAir platform with homebridge', () => {
			homebridge(mockApi);

			expect(mockApi.registerPlatform).to.have.been.calledOnce;
			expect(mockApi.registerPlatform).to.have.been.calledWith(PLATFORM_NAME, RabbitAirPlatform);
		});

		it('should export a default function', () => {
			expect(homebridge).to.be.a('function');
		});
	});

	describe('platform lifecycle', () => {
		it('should handle platform initialization', () => {
			// This would typically involve more complex setup
			// For now, we verify the platform can be instantiated
			expect(() => homebridge(mockApi)).to.not.throw();
		});
	});
});