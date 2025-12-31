import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestHarness } from '@pmouli/hap-test';
import type { PlatformAccessory } from 'homebridge';
import { RabbitAirPlatform } from '../../src/platform.js';

const DEVICE_CONFIG = {
  name: 'Test Purifier',
  host: '192.168.1.100',
  token: '0123456789ABCDEF0123456789ABCDEF',
  port: 9009
};

describe('RabbitAirAccessory - Service Registration (hap-test)', () => {
  let harness: TestHarness;
  let platform: RabbitAirPlatform;
  let registeredAccessories: PlatformAccessory[] = [];

  beforeEach(async () => {
    harness = await TestHarness.create({
      platformConstructor: RabbitAirPlatform,
      platformConfig: {
        platform: 'RabbitAir',
        name: 'RabbitAir',
        devices: [DEVICE_CONFIG]
      }
    });

    const BaseAccessory = (harness.api.hap as any).Accessory;
    (harness.api as any).platformAccessory = class PlatformAccessoryWithContext extends BaseAccessory {
      context: Record<string, unknown> = {};
      constructor(name: string, uuid: string) {
        super(name, uuid);
        this.context = {};
      }
    } as any;

    const log = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
      success: vi.fn(),
      prefix: 'hap-test'
    } as any;

    platform = new RabbitAirPlatform(log, {
      platform: 'RabbitAir',
      name: 'RabbitAir',
      devices: [DEVICE_CONFIG]
    }, harness.api as any);

    const accessoriesReady = new Promise<void>((resolve) => {
      harness.on('registerPlatformAccessories', (accessories: PlatformAccessory[]) => {
        registeredAccessories = accessories;
        resolve();
      });
    });

    harness.api.emitDidFinishLaunching();
    await accessoriesReady;
  });

  const getRegistered = () => registeredAccessories || harness.api.platformAccessories();

  it('registers Air Purifier service with correct UUID (T008)', () => {
    const { Service } = harness.api.hap;
    const accessories = getRegistered();
    expect(accessories.length).toBeGreaterThanOrEqual(1);

    const [accessory] = accessories;
    expect(accessory.UUID).toBeDefined();
    const purifierService = accessory.getService(Service.AirPurifier);
    expect(purifierService?.UUID).toBe(Service.AirPurifier.UUID);
  });

  it('registers Air Quality Sensor service with correct UUID (T009)', () => {
    const { Service } = harness.api.hap;
    const accessories = getRegistered();
    const [accessory] = accessories;
    const service = accessory.getService(Service.AirQualitySensor);
    expect(service?.UUID).toBe(Service.AirQualitySensor.UUID);
  });

  it('registers Filter Maintenance service alongside purifier (T010 subset)', () => {
    const { Service } = harness.api.hap;
    const accessories = getRegistered();
    const [accessory] = accessories;
    const service = accessory.getService(Service.FilterMaintenance);
    expect(service?.UUID).toBe(Service.FilterMaintenance.UUID);
  });

  it('registers required Air Purifier characteristics (T010)', () => {
    const accessories = getRegistered();
    const { Service, Characteristic } = harness.api.hap;
    const purifierService = accessories[0].getService(Service.AirPurifier);
    expect(purifierService).toBeDefined();
    expect(purifierService!.getCharacteristic(Characteristic.Active)).toBeDefined();
    expect(purifierService!.getCharacteristic(Characteristic.CurrentAirPurifierState)).toBeDefined();
    expect(purifierService!.getCharacteristic(Characteristic.TargetAirPurifierState)).toBeDefined();
    expect(purifierService!.getCharacteristic(Characteristic.RotationSpeed)).toBeDefined();
  });

  it('registers Filter Maintenance characteristics (T010)', () => {
    const accessories = getRegistered();
    const { Service, Characteristic } = harness.api.hap;
    const filterService = accessories[0].getService(Service.FilterMaintenance);
    expect(filterService).toBeDefined();
    expect(filterService!.getCharacteristic(Characteristic.FilterLifeLevel)).toBeDefined();
    expect(filterService!.getCharacteristic(Characteristic.FilterChangeIndication)).toBeDefined();
  });

  it('registers Air Quality characteristic (T011)', () => {
    const accessories = getRegistered();
    const { Service, Characteristic } = harness.api.hap;
    const airQualityService = accessories[0].getService(Service.AirQualitySensor);
    expect(airQualityService).toBeDefined();
    expect(airQualityService!.getCharacteristic(Characteristic.AirQuality)).toBeDefined();
  });

  it('configures characteristic types and ranges (T012)', () => {
    const accessories = getRegistered();
    const { Service, Characteristic } = harness.api.hap;
    const purifierService = accessories[0].getService(Service.AirPurifier);
    const rotationSpeed = purifierService!.getCharacteristic(Characteristic.RotationSpeed);
    const filterService = accessories[0].getService(Service.FilterMaintenance);
    const filterLife = filterService!.getCharacteristic(Characteristic.FilterLifeLevel);
    const airQualityService = accessories[0].getService(Service.AirQualitySensor);
    const airQuality = airQualityService!.getCharacteristic(Characteristic.AirQuality);

    expect(rotationSpeed!.props.minValue).toBeLessThanOrEqual(0);
    expect(rotationSpeed!.props.maxValue).toBeGreaterThanOrEqual(100);
    expect(filterLife!.props.minValue).toBeLessThanOrEqual(0);
    expect(filterLife!.props.maxValue).toBeGreaterThanOrEqual(100);
    expect(airQuality!.props.minValue).toBeLessThanOrEqual(0);
    expect(airQuality!.props.maxValue).toBeGreaterThanOrEqual(5);
  });
});
