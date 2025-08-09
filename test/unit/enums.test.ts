import { expect } from 'chai';
import { 
	RabbitAirMode, 
	RabbitAirSpeed, 
	RabbitAirQuality 
} from '../../src/rabbitair-client.js';

describe('RabbitAir Enums', () => {
	describe('RabbitAirMode', () => {
		it('should have correct values', () => {
			expect(RabbitAirMode.Auto).to.equal(0);
			expect(RabbitAirMode.Pollen).to.equal(1);
			expect(RabbitAirMode.Manual).to.equal(2);
		});
	});

	describe('RabbitAirSpeed', () => {
		it('should have correct values', () => {
			expect(RabbitAirSpeed.SuperSilent).to.equal(0);
			expect(RabbitAirSpeed.Silent).to.equal(1);
			expect(RabbitAirSpeed.Low).to.equal(2);
			expect(RabbitAirSpeed.Medium).to.equal(3);
			expect(RabbitAirSpeed.High).to.equal(4);
			expect(RabbitAirSpeed.Turbo).to.equal(5);
		});
	});

	describe('RabbitAirQuality', () => {
		it('should have correct values', () => {
			expect(RabbitAirQuality.Lowest).to.equal(0);
			expect(RabbitAirQuality.Low).to.equal(1);
			expect(RabbitAirQuality.Medium).to.equal(2);
			expect(RabbitAirQuality.High).to.equal(3);
			expect(RabbitAirQuality.Highest).to.equal(4);
		});
	});
});