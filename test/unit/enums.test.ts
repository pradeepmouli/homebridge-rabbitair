import { describe, it, expect } from 'vitest';
import { 
	RabbitAirMode, 
	RabbitAirSpeed, 
	RabbitAirQuality 
} from '../../src/rabbitair-client.js';

describe('RabbitAir Enums', () => {
	describe('RabbitAirMode', () => {
		it('should have correct values', () => {
			expect(RabbitAirMode.Auto).toBe(0);
			expect(RabbitAirMode.Pollen).toBe(1);
			expect(RabbitAirMode.Manual).toBe(2);
		});
	});

	describe('RabbitAirSpeed', () => {
		it('should have correct values', () => {
			expect(RabbitAirSpeed.SuperSilent).toBe(0);
			expect(RabbitAirSpeed.Silent).toBe(1);
			expect(RabbitAirSpeed.Low).toBe(2);
			expect(RabbitAirSpeed.Medium).toBe(3);
			expect(RabbitAirSpeed.High).toBe(4);
			expect(RabbitAirSpeed.Turbo).toBe(5);
		});
	});

	describe('RabbitAirQuality', () => {
		it('should have correct values', () => {
			expect(RabbitAirQuality.Lowest).toBe(0);
			expect(RabbitAirQuality.Low).toBe(1);
			expect(RabbitAirQuality.Medium).toBe(2);
			expect(RabbitAirQuality.High).toBe(3);
			expect(RabbitAirQuality.Highest).toBe(4);
		});
	});
});