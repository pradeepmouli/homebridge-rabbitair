---
name: homebridge-plugin-dev
description: Homebridge plugin development with HAP-NodeJS, TypeScript, platform/accessory patterns, and HomeKit integration
---

# Homebridge Plugin Development

Use this skill when creating or maintaining Homebridge plugins, integrating IoT devices with HomeKit, or working with HAP-NodeJS.

## Plugin Architecture Overview

### Platform vs Accessory Plugins

**Dynamic Platform Plugin** (Recommended):
- Discovers multiple devices
- Adds/removes accessories dynamically
- Configuration-driven
- Example: ISY controller with multiple devices

**Accessory Plugin** (Simple):
- Single static accessory
- Fixed configuration
- Example: Single smart light

**Static Platform Plugin** (Legacy):
- Multiple accessories defined in config
- No dynamic discovery
- Avoid for new plugins

## Project Setup

### 1. Initialize Plugin Package

```bash
mkdir homebridge-my-device
cd homebridge-my-device
pnpm init
```

### 2. Package.json Structure

```json
{
  "name": "homebridge-my-device",
  "version": "1.0.0",
  "description": "Homebridge plugin for My Device",
  "type": "module",
  "main": "dist/index.js",
  "keywords": [
    "homebridge-plugin",
    "homebridge",
    "homekit",
    "my-device"
  ],
  "engines": {
    "node": "^18.20 || ^20.17 || ^22.11",
    "homebridge": "^1.8.0 || ^2.0.0-beta.0"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "oxfmt",
    "prepublishOnly": "pnpm build"
  },
  "dependencies": {
    "node-persist": "^4.0.0"
  },
  "devDependencies": {
    "homebridge": "^1.8.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0",
    "oxlint": "^0.15.0"
  }
}
```

### 3. TypeScript Configuration

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Platform Plugin Implementation

### 1. Main Plugin Entry (src/index.ts)

```typescript
import type {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';

const PLATFORM_NAME = 'MyDevicePlatform';
const PLUGIN_NAME = 'homebridge-my-device';

export default (api: API) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, MyDevicePlatform);
};

interface MyDeviceConfig extends PlatformConfig {
  deviceIp?: string;
  pollingInterval?: number;
  debugMode?: boolean;
}

export class MyDevicePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // Track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: MyDeviceConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', this.config.name);

    // Homebridge emits didFinishLaunching when restored cached accessories are loaded
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  /**
   * Called when Homebridge restores cached accessories from disk
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  /**
   * Discover devices and register as accessories
   */
  async discoverDevices() {
    // Example: Discover devices from network/API
    const devices = await this.fetchDevices();

    for (const device of devices) {
      // Generate unique identifier
      const uuid = this.api.hap.uuid.generate(device.id);

      // Check if accessory already exists
      const existingAccessory = this.accessories.find(acc => acc.UUID === uuid);

      if (existingAccessory) {
        // Restore from cache
        this.log.info('Restoring existing accessory:', existingAccessory.displayName);
        new MyDeviceAccessory(this, existingAccessory, device);
      } else {
        // Create new accessory
        this.log.info('Adding new accessory:', device.name);
        const accessory = new this.api.platformAccessory(device.name, uuid);

        // Store device info in context
        accessory.context.device = device;

        // Create accessory handler
        new MyDeviceAccessory(this, accessory, device);

        // Register with Homebridge
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }

    // Remove accessories that are no longer present
    const staleAccessories = this.accessories.filter(
      acc => !devices.find(dev => this.api.hap.uuid.generate(dev.id) === acc.UUID)
    );

    if (staleAccessories.length > 0) {
      this.log.info('Removing stale accessories:', staleAccessories.map(a => a.displayName));
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, staleAccessories);
    }
  }

  async fetchDevices(): Promise<Device[]> {
    // Implement device discovery logic
    return [];
  }
}

interface Device {
  id: string;
  name: string;
  type: string;
  // Add device-specific properties
}
```

### 2. Accessory Implementation (src/accessory.ts)

```typescript
import type {
  Service,
  PlatformAccessory,
  CharacteristicValue,
} from 'homebridge';
import type { MyDevicePlatform } from './index.js';
import type { Device } from './types.js';

export class MyDeviceAccessory {
  private service: Service;

  // Store current state
  private state = {
    On: false,
    Brightness: 100,
  };

  constructor(
    private readonly platform: MyDevicePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Device,
  ) {
    // Set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'My Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, device.type)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, device.id);

    // Get or create service
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    // Set service name (this is what appears in the Home app)
    this.service.setCharacteristic(this.platform.Characteristic.Name, device.name);

    // Register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))
      .onGet(this.getBrightness.bind(this));

    // Start polling for state updates (if needed)
    this.startPolling();
  }

  /**
   * Handle SET requests from HomeKit
   */
  async setOn(value: CharacteristicValue) {
    const on = value as boolean;
    this.platform.log.debug('Set On ->', on);

    // Send command to device
    await this.sendCommand({ power: on ? 'on' : 'off' });

    // Update internal state
    this.state.On = on;
  }

  /**
   * Handle GET requests from HomeKit
   */
  async getOn(): Promise<CharacteristicValue> {
    const on = this.state.On;
    this.platform.log.debug('Get On ->', on);
    return on;
  }

  async setBrightness(value: CharacteristicValue) {
    const brightness = value as number;
    this.platform.log.debug('Set Brightness ->', brightness);

    await this.sendCommand({ brightness });
    this.state.Brightness = brightness;
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return this.state.Brightness;
  }

  /**
   * Send command to physical device
   */
  async sendCommand(command: Record<string, unknown>) {
    try {
      // Implement device communication
      this.platform.log.debug('Sending command:', command);

      // Example HTTP request
      // await fetch(`http://${this.device.ip}/api/control`, {
      //   method: 'POST',
      //   body: JSON.stringify(command),
      // });
    } catch (error) {
      this.platform.log.error('Failed to send command:', error);
      throw new this.platform.api.hap.HapStatusError(
        this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
      );
    }
  }

  /**
   * Poll device for state updates
   */
  startPolling() {
    const interval = this.platform.config.pollingInterval || 30000;

    setInterval(async () => {
      try {
        const state = await this.fetchDeviceState();

        // Update characteristics if state changed
        if (state.power !== this.state.On) {
          this.state.On = state.power;
          this.service.updateCharacteristic(this.platform.Characteristic.On, state.power);
        }

        if (state.brightness !== this.state.Brightness) {
          this.state.Brightness = state.brightness;
          this.service.updateCharacteristic(this.platform.Characteristic.Brightness, state.brightness);
        }
      } catch (error) {
        this.platform.log.error('Failed to poll device state:', error);
      }
    }, interval);
  }

  async fetchDeviceState() {
    // Implement state fetching from device
    return {
      power: this.state.On,
      brightness: this.state.Brightness,
    };
  }
}
```

## Common Service Types

### Lightbulb
```typescript
this.service = accessory.addService(this.platform.Service.Lightbulb);
// Characteristics: On, Brightness, Hue, Saturation, ColorTemperature
```

### Switch
```typescript
this.service = accessory.addService(this.platform.Service.Switch);
// Characteristics: On
```

### Thermostat
```typescript
this.service = accessory.addService(this.platform.Service.Thermostat);
// Characteristics: CurrentTemperature, TargetTemperature, CurrentHeatingCoolingState, TargetHeatingCoolingState
```

### Lock
```typescript
this.service = accessory.addService(this.platform.Service.LockMechanism);
// Characteristics: LockCurrentState, LockTargetState
```

### Air Quality Sensor
```typescript
this.service = accessory.addService(this.platform.Service.AirQualitySensor);
// Characteristics: AirQuality, PM2_5Density, VOCDensity
```

### Fan
```typescript
this.service = accessory.addService(this.platform.Service.Fanv2);
// Characteristics: Active, RotationSpeed, RotationDirection
```

## Configuration Schema (config.schema.json)

Create a schema for Homebridge Config UI X:

```json
{
  "pluginAlias": "MyDevicePlatform",
  "pluginType": "platform",
  "singular": false,
  "schema": {
    "type": "object",
    "properties": {
      "name": {
        "title": "Name",
        "type": "string",
        "required": true,
        "default": "My Device"
      },
      "deviceIp": {
        "title": "Device IP Address",
        "type": "string",
        "required": true,
        "format": "ipv4",
        "placeholder": "192.168.1.100"
      },
      "pollingInterval": {
        "title": "Polling Interval (ms)",
        "type": "number",
        "default": 30000,
        "minimum": 1000,
        "description": "How often to poll device for state updates"
      },
      "debugMode": {
        "title": "Enable Debug Logging",
        "type": "boolean",
        "default": false
      }
    }
  },
  "layout": [
    {
      "type": "flex",
      "flex-flow": "row wrap",
      "items": ["name", "deviceIp"]
    },
    {
      "type": "flex",
      "flex-flow": "row wrap",
      "items": ["pollingInterval", "debugMode"]
    }
  ]
}
```

## Error Handling Best Practices

### HAP Status Errors
```typescript
import { HapStatusError, HAPStatus } from 'homebridge';

async setOn(value: CharacteristicValue) {
  try {
    await this.sendCommand({ power: value ? 'on' : 'off' });
  } catch (error) {
    this.platform.log.error('Failed to set power:', error);

    // Throw appropriate HAP error
    throw new HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
  }
}
```

### Timeout Handling
```typescript
async sendCommandWithTimeout(command: Record<string, unknown>, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(this.deviceUrl, {
      method: 'POST',
      body: JSON.stringify(command),
      signal: controller.signal,
    });

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Device request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

## Testing Your Plugin

### 1. Link Locally
```bash
pnpm build
pnpm link --global
```

### 2. Test in Homebridge
```bash
# Install Homebridge globally if not already
npm install -g homebridge

# Link your plugin
cd ~/.homebridge
pnpm link --global homebridge-my-device

# Run Homebridge
homebridge -D
```

### 3. Configuration (~/.homebridge/config.json)
```json
{
  "platforms": [
    {
      "platform": "MyDevicePlatform",
      "name": "My Device",
      "deviceIp": "192.168.1.100",
      "pollingInterval": 30000
    }
  ]
}
```

### 4. Unit Tests with Vitest

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { API, Logger, PlatformConfig } from 'homebridge';
import { MyDevicePlatform } from '../src/index.js';

describe('MyDevicePlatform', () => {
  const mockAPI = {
    hap: {
      Service: {},
      Characteristic: {},
      uuid: {
        generate: vi.fn((id: string) => `uuid-${id}`),
      },
    },
    on: vi.fn(),
    registerPlatformAccessories: vi.fn(),
  } as unknown as API;

  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as Logger;

  const mockConfig: PlatformConfig = {
    platform: 'MyDevicePlatform',
    name: 'Test Device',
    deviceIp: '192.168.1.100',
  };

  it('should initialize platform', () => {
    const platform = new MyDevicePlatform(mockLogger, mockConfig, mockAPI);
    expect(platform).toBeDefined();
    expect(mockAPI.on).toHaveBeenCalledWith('didFinishLaunching', expect.any(Function));
  });

  it('should discover devices', async () => {
    const platform = new MyDevicePlatform(mockLogger, mockConfig, mockAPI);

    // Mock device discovery
    vi.spyOn(platform, 'fetchDevices').mockResolvedValue([
      { id: 'device1', name: 'Light 1', type: 'light' },
    ]);

    await platform.discoverDevices();

    expect(mockAPI.registerPlatformAccessories).toHaveBeenCalled();
  });
});
```

## Publishing Your Plugin

### 1. Verify Plugin (homebridge-plugin-verifier)
```bash
npx -p homebridge homebridge-plugin-verifier
```

### 2. Update package.json
- Ensure `keywords` includes "homebridge-plugin"
- Set `engines.homebridge` to minimum supported version
- Add `config.schema.json` to published files

### 3. Publish to npm
```bash
pnpm build
pnpm publish
```

### 4. Submit to Homebridge Verified
- Open PR to https://github.com/homebridge/verified
- Ensure plugin meets all requirements
- Wait for review and approval

## Debugging Tips

### Enable Debug Logging
```bash
# Set DEBUG environment variable
DEBUG=* homebridge -D

# Or specific namespace
DEBUG=homebridge-my-device homebridge
```

### Use logger.debug()
```typescript
this.platform.log.debug('Device state:', state);
```

### Check Homebridge Logs
```bash
# macOS/Linux
tail -f ~/.homebridge/homebridge.log

# Or use Homebridge UI
# http://localhost:8581
```

### Common Issues

**Accessory not appearing in Home app**:
- Check plugin is registered correctly
- Verify `didFinishLaunching` event is handled
- Ensure UUID is consistent
- Try removing cached accessories

**Characteristics not updating**:
- Verify `updateCharacteristic()` is called
- Check polling interval
- Ensure device communication is working

**"This accessory is not certified"**:
- Normal for development plugins
- Add to Home app anyway
- Will disappear after certification

## Advanced Patterns

### Event-based Updates (vs Polling)
```typescript
// Subscribe to device events
this.device.on('stateChange', (newState) => {
  this.service.updateCharacteristic(
    this.platform.Characteristic.On,
    newState.power
  );
});
```

### Multiple Services per Accessory
```typescript
// Add multiple services to one accessory
const lightService = accessory.addService(this.platform.Service.Lightbulb, 'Light');
const fanService = accessory.addService(this.platform.Service.Fanv2, 'Fan');
```

### Custom Characteristics
```typescript
// Use manufacturer-specific characteristics
const customChar = new this.platform.Characteristic('CustomSetting', 'UUID-HERE', {
  format: this.platform.Characteristic.Formats.BOOL,
  perms: [this.platform.Characteristic.Perms.READ, this.platform.Characteristic.Perms.WRITE],
});

this.service.addCharacteristic(customChar)
  .onSet(this.setCustomSetting.bind(this));
```

## Resources

- Homebridge API: https://developers.homebridge.io/
- HAP-NodeJS: https://github.com/homebridge/HAP-NodeJS
- Service/Characteristic Types: https://developers.homebridge.io/#/service
- Plugin Development: https://developers.homebridge.io/#/
- Verified Plugins: https://github.com/homebridge/verified
