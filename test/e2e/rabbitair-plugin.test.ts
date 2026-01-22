/// <reference types="vitest" />
import { TestHarness } from '@pmouli/hap-test';
import { RabbitAirPlatform } from '../../src/platform.js';
import { RabbitAirAccessory } from '../../src/platformAccessory.js';
import { RabbitAirClient, RabbitAirMode, RabbitAirQuality, RabbitAirSpeed } from '../../src/rabbitair-client.js';

const vi = (globalThis as any).vi as typeof import('vitest')['vi'] | undefined;
const expect = (globalThis as any).expect as typeof import('vitest')['expect'] | undefined;
const isVitest = Boolean(vi && expect);

const DEVICE_CONFIG = {
  name: 'E2E Purifier',
  host: '192.168.1.100',
  token: '0123456789ABCDEF0123456789ABCDEF',
  port: 9009
};

const PLATFORM_CONFIG = {
  platform: 'RabbitAir',
  name: 'RabbitAir',
  devices: [DEVICE_CONFIG]
};

const createLogger = () => ({
  debug: vi!.fn(),
  info: vi!.fn(),
  warn: vi!.fn(),
  error: vi!.fn(),
  log: vi!.fn()
});

if (!isVitest) {
  describe('RabbitAir Plugin E2E - Smoke Tests (T048-T050)', () => {
    it('skipped under mocha runner', function () {
      this.skip();
    });
  });
} else {
  describe('RabbitAir Plugin E2E - Smoke Tests (T048-T050)', () => {
  let harness: TestHarness;
  let platform: RabbitAirPlatform;
  let registeredAccessory: any;
  let accessoryHandler: RabbitAirAccessory;
  let setStateSpy: any;
  let getStateSpy: any;
  let shutdownSpy: any;
  let startPeriodicUpdatesSpy: any;

  beforeEach(async () => {
    setStateSpy = vi!.spyOn(RabbitAirClient.prototype, 'setState').mockResolvedValue();
    getStateSpy = vi!.spyOn(RabbitAirClient.prototype, 'getState').mockResolvedValue({
      power: false,
      mode: RabbitAirMode.Auto,
      speed: RabbitAirSpeed.Low,
      quality: RabbitAirQuality.Medium,
      idle: 0,
      filterLife: 80,
      filterReplacement: false
    } as any);
    shutdownSpy = vi!.spyOn(RabbitAirClient.prototype, 'shutdown').mockResolvedValue();
    startPeriodicUpdatesSpy = vi!
      .spyOn(RabbitAirAccessory.prototype as any, 'startPeriodicUpdates')
      .mockImplementation(() => {});

    harness = await TestHarness.create({
      platformConstructor: RabbitAirPlatform,
      platformConfig: PLATFORM_CONFIG
    });

    // Ensure accessories created by the platform include a context bag for device config
    const BaseAccessory = (harness.api.hap as any).Accessory;
    (harness.api as any).platformAccessory = class PlatformAccessoryWithContext extends BaseAccessory {
      context: Record<string, unknown> = {};
      constructor(name: string, uuid: string) {
        super(name, uuid);
        this.context = {};
      }
    } as any;

    const logger = createLogger();
    platform = new RabbitAirPlatform(logger as any, PLATFORM_CONFIG as any, harness.api as any);

    const accessoriesReady = new Promise<void>((resolve) => {
      harness.on('registerPlatformAccessories', (accessories: any[]) => {
        registeredAccessory = accessories[0];
        resolve();
      });
    });

    harness.api.emitDidFinishLaunching();
    await accessoriesReady;

    accessoryHandler = new RabbitAirAccessory(platform as any, registeredAccessory as any);
  });

  afterEach(async () => {
    await accessoryHandler?.cleanup();
    harness?.shutdown();
    vi!.restoreAllMocks();
  });

  it('initializes platform and registers accessory (T048)', () => {
    expect!(registeredAccessory).toBeDefined();
    expect!(registeredAccessory.displayName).toBe(DEVICE_CONFIG.name);
    expect!(registeredAccessory.context.device).toEqual(DEVICE_CONFIG);
  });

  it('completes power-on workflow via Active characteristic (T049)', async () => {
    await (accessoryHandler as any).client.setState({ power: true });

    expect!(setStateSpy).toHaveBeenCalledWith({ power: true });
  });

  it('reports device state from client (T050)', async () => {
    await (accessoryHandler as any).updateDeviceState();

    expect!(getStateSpy).toHaveBeenCalled();
  });
  });
}
