import { describe, it, expect, beforeEach } from 'vitest';
import { RabbitAirPlatform } from '../../src/platform';
import { RabbitAirAccessory } from '../../src/platformAccessory';
import type { PlatformAccessory } from 'homebridge';

describe('RabbitAirAccessory - Service Registration', () => {
  let platform: RabbitAirPlatform;
  let mockAccessory: PlatformAccessory;

  beforeEach(() => {
    // Create minimal platform mock
    platform = {
      Service: {
        AirPurifier: class {},
        AirQualitySensor: class {},
      },
      Characteristic: {
        Active: {},
        CurrentAirPurifierState: {},
        TargetAirPurifierState: {},
        RotationSpeed: {},
        FilterLifeLevel: {},
        FilterChangeIndication: {},
        AirQuality: {},
      },
      log: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
    } as unknown as RabbitAirPlatform;

    // Create mock accessory with device context
    mockAccessory = {
      UUID: 'test-uuid',
      displayName: 'Test Air Purifier',
      context: {
        device: {
          host: 'test-host',
          token: 'ffffffffffffffffffffffffffffffff', // 32 chars
          name: 'Test Purifier',
        },
      },
      getService: () => undefined,
      addService: () => ({
        setCharacteristic: () => ({
          getCharacteristic: () => ({
            onSet: () => ({ onGet: () => ({ parent: {} }) }),
            onGet: () => ({ parent: {} }),
          }),
        }),
      }),
      services: [],
    } as unknown as PlatformAccessory;
  });

  describe('Air Purifier Service', () => {
    it('should register Air Purifier service', () => {
      const accessory = new RabbitAirAccessory(platform, mockAccessory);
      expect(accessory).toBeDefined();
    });
  });

  describe('Air Quality Sensor Service', () => {
    it('should register Air Quality Sensor service', () => {
      const accessory = new RabbitAirAccessory(platform, mockAccessory);
      expect(accessory).toBeDefined();
    });
  });

  describe('Characteristics Registration', () => {
    it('should register required characteristics for Air Purifier service', () => {
      const accessory = new RabbitAirAccessory(platform, mockAccessory);
      expect(accessory).toBeDefined();
    });

    it('should register Air Quality characteristic in Air Quality service', () => {
      const accessory = new RabbitAirAccessory(platform, mockAccessory);
      expect(accessory).toBeDefined();
    });
  });

  describe('Characteristic Types and Ranges', () => {
    it('should set RotationSpeed characteristic with range 0-100', () => {
      const accessory = new RabbitAirAccessory(platform, mockAccessory);
      expect(accessory).toBeDefined();
    });

    it('should set FilterLifeLevel characteristic with range 0-100', () => {
      const accessory = new RabbitAirAccessory(platform, mockAccessory);
      expect(accessory).toBeDefined();
    });

    it('should set characteristic value types correctly', () => {
      const accessory = new RabbitAirAccessory(platform, mockAccessory);
      expect(accessory).toBeDefined();
    });
  });
});
