import '../setup.js';
import { expect } from 'chai';
import sinon from 'sinon';
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
      debug: sinon.stub(),
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      log: sinon.stub(),
      success: sinon.stub(),
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
    expect(accessories.length).to.be.at.least(1);

    const [accessory] = accessories;
    expect(accessory.UUID).to.exist;
    const purifierService = accessory.getService(Service.AirPurifier);
    expect(purifierService?.UUID).to.equal(Service.AirPurifier.UUID);
  });

  it('registers Air Quality Sensor service with correct UUID (T009)', () => {
    const { Service } = harness.api.hap;
    const accessories = getRegistered();
    const [accessory] = accessories;
    const service = accessory.getService(Service.AirQualitySensor);
    expect(service?.UUID).to.equal(Service.AirQualitySensor.UUID);
  });

  it('registers Filter Maintenance service alongside purifier (T010 subset)', () => {
    const { Service } = harness.api.hap;
    const accessories = getRegistered();
    const [accessory] = accessories;
    const service = accessory.getService(Service.FilterMaintenance);
    expect(service?.UUID).to.equal(Service.FilterMaintenance.UUID);
  });

  it('registers required Air Purifier characteristics (T010)', () => {
    const accessories = getRegistered();
    const { Service, Characteristic } = harness.api.hap;
    const purifierService = accessories[0].getService(Service.AirPurifier);
    expect(purifierService).to.exist;
    expect(purifierService!.getCharacteristic(Characteristic.Active)).to.exist;
    expect(purifierService!.getCharacteristic(Characteristic.CurrentAirPurifierState)).to.exist;
    expect(purifierService!.getCharacteristic(Characteristic.TargetAirPurifierState)).to.exist;
    expect(purifierService!.getCharacteristic(Characteristic.RotationSpeed)).to.exist;
  });

  it('registers Filter Maintenance characteristics (T010)', () => {
    const accessories = getRegistered();
    const { Service, Characteristic } = harness.api.hap;
    const filterService = accessories[0].getService(Service.FilterMaintenance);
    expect(filterService).to.exist;
    expect(filterService!.getCharacteristic(Characteristic.FilterLifeLevel)).to.exist;
    expect(filterService!.getCharacteristic(Characteristic.FilterChangeIndication)).to.exist;
  });

  it('registers Air Quality characteristic (T011)', () => {
    const accessories = getRegistered();
    const { Service, Characteristic } = harness.api.hap;
    const airQualityService = accessories[0].getService(Service.AirQualitySensor);
    expect(airQualityService).to.exist;
    expect(airQualityService!.getCharacteristic(Characteristic.AirQuality)).to.exist;
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

    expect(rotationSpeed!.props.minValue).to.be.at.most(0);
    expect(rotationSpeed!.props.maxValue).to.be.at.least(100);
    expect(filterLife!.props.minValue).to.be.at.most(0);
    expect(filterLife!.props.maxValue).to.be.at.least(100);
    expect(airQuality!.props.minValue).to.be.at.most(0);
    expect(airQuality!.props.maxValue).to.be.at.least(5);
  });
});
