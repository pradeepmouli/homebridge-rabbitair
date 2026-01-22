/// <reference types="vitest" />
import { NetworkError, NetworkErrorType, NetworkSimulator, TestHarness, MockAccessory, MockCharacteristic, MockService } from '@pmouli/hap-test';
import { RabbitAirPlatform } from '../../src/platform.js';

const DEVICE_CONFIG = {
  name: 'Integration Purifier',
  host: '192.168.1.100',
  token: '0123456789ABCDEF0123456789ABCDEF',
  port: 9009
};

const PLATFORM_CONFIG = {
  platform: 'RabbitAir',
  name: 'RabbitAir',
  devices: [DEVICE_CONFIG]
};

const vi = (globalThis as any).vi as typeof import('vitest')['vi'] | undefined;
const expect = (globalThis as any).expect as typeof import('vitest')['expect'] | undefined;
const isVitest = Boolean(vi && expect);

if (!isVitest) {
  // Skip when run under Mocha
  describe('Network Resilience - Integration Tests (T043-T047)', () => {
    it('skipped under mocha runner', function () {
      this.skip();
    });
  });
} else {
  describe('Network Resilience - Integration Tests (T043-T047)', () => {
  let harness: TestHarness;
  let simulator: NetworkSimulator;
  let accessory: MockAccessory;

  beforeEach(async () => {
    vi!.useFakeTimers();

    harness = await TestHarness.create({
      platformConstructor: RabbitAirPlatform,
      platformConfig: PLATFORM_CONFIG
    });

    simulator = new NetworkSimulator();
    harness.homeKit.setNetworkSimulator(simulator);

    accessory = new MockAccessory('network-resilience-accessory', 'Network Resilience Purifier');

    const purifierService = new MockService('AirPurifier', 'Air Purifier');
    const active = new MockCharacteristic('Active', 'Active', 0, {
      format: 'bool',
      perms: ['pr', 'pw', 'ev'],
      minValue: 0,
      maxValue: 1
    });

    purifierService.addCharacteristic(active);
    accessory.addService(purifierService);
    harness.homeKit.addAccessory(accessory);
  });

    afterEach(() => {
      harness?.shutdown();
      vi!.useRealTimers();
      vi!.restoreAllMocks();
    });

    const getActiveCharacteristic = () => {
      const active = harness.homeKit.characteristic(accessory.UUID, 'Air Purifier', 'Active');
      expect!(active).toBeDefined();
      return active!;
    };

    const performWithRetries = async (operation: () => Promise<void>, maxAttempts = 3) => {
      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          attempt += 1;
          await operation();
          return attempt;
        } catch (error) {
          if (error instanceof NetworkError && error.errorType === NetworkErrorType.PACKET_LOSS && attempt < maxAttempts) {
            continue;
          }
          throw error;
        }
      }
      throw new Error('Exceeded retry attempts');
    };

    it('processes characteristic updates with 200ms latency (T045)', async () => {
      simulator.setLatency(200);
      const active = getActiveCharacteristic();

      const setPromise = active.setValue(true);
      await vi!.advanceTimersByTimeAsync(200);
      await setPromise;

      const getPromise = active.getValue();
      await vi!.advanceTimersByTimeAsync(200);
      const value = await getPromise;

      expect!(value).toBe(true);
      expect!(active.getHistory()).toHaveLength(1);
    });

    it('retries characteristic updates through 50% packet loss (T046)', async () => {
      simulator.setPacketLoss(0.5);
      const active = getActiveCharacteristic();

      vi!.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.9);

      const attempts = await performWithRetries(async () => {
        await active.setValue(false);
      });

      await vi!.runAllTimersAsync();

      const value = await active.getValue();

      expect!(attempts).toBe(2);
      expect!(value).toBe(false);
    });
  });
}
