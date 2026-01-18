---
name: hap-nodejs
description: HomeKit Accessory Protocol (HAP) implementation with HAP-NodeJS for creating HomeKit accessories and bridges
---

# HAP-NodeJS Development

Use this skill when implementing HomeKit accessories using HAP-NodeJS, creating bridges, or working with HAP protocol directly.

## HAP Architecture Overview

HAP is Apple's protocol for smart home device communication:
- **Accessories**: Physical or virtual devices (lights, locks, thermostats)
- **Services**: Functional units within accessories (lightbulb service, battery service)
- **Characteristics**: Properties of services (on/off, brightness, temperature)
- **Pairing**: Secure device authentication using SRP and Ed25519

## Basic Accessory Structure

```typescript
import {
  Accessory,
  AccessoryEventTypes,
  Categories,
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicValue,
  Service,
} from 'hap-nodejs';

export class LightbulbAccessory {
  private accessory: Accessory;
  private lightbulbService: Service;

  // State
  private powerOn = false;
  private brightness = 100;

  constructor(name: string, uuid: string) {
    // Create accessory
    this.accessory = new Accessory(name, uuid);

    // Set category (affects icon in Home app)
    this.accessory.category = Categories.LIGHTBULB;

    // Configure accessory information
    this.accessory
      .getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'My Company')
      .setCharacteristic(Characteristic.Model, 'Light v1.0')
      .setCharacteristic(Characteristic.SerialNumber, uuid);

    // Add lightbulb service
    this.lightbulbService = this.accessory.addService(Service.Lightbulb, name);

    // Configure On characteristic
    this.lightbulbService
      .getCharacteristic(Characteristic.On)!
      .on(CharacteristicEventTypes.GET, this.getOn.bind(this))
      .on(CharacteristicEventTypes.SET, this.setOn.bind(this));

    // Configure Brightness characteristic
    this.lightbulbService
      .getCharacteristic(Characteristic.Brightness)!
      .on(CharacteristicEventTypes.GET, this.getBrightness.bind(this))
      .on(CharacteristicEventTypes.SET, this.setBrightness.bind(this));

    // Publish accessory
    this.accessory.publish({
      username: this.generateMacAddress(uuid),
      pincode: '031-45-154',
      port: 0, // Random port
      category: Categories.LIGHTBULB,
    });

    console.log(`Accessory "${name}" published`);
    console.log('Setup code: 031-45-154');
  }

  private getOn(callback: (error: Error | null, value?: CharacteristicValue) => void) {
    console.log('GET On:', this.powerOn);
    callback(null, this.powerOn);
  }

  private setOn(
    value: CharacteristicValue,
    callback: (error?: Error | null) => void
  ) {
    this.powerOn = value as boolean;
    console.log('SET On:', this.powerOn);

    // Control physical device here
    this.controlDevice({ power: this.powerOn });

    callback();
  }

  private getBrightness(callback: (error: Error | null, value?: CharacteristicValue) => void) {
    console.log('GET Brightness:', this.brightness);
    callback(null, this.brightness);
  }

  private setBrightness(
    value: CharacteristicValue,
    callback: (error?: Error | null) => void
  ) {
    this.brightness = value as number;
    console.log('SET Brightness:', this.brightness);

    this.controlDevice({ brightness: this.brightness });

    callback();
  }

  private controlDevice(command: { power?: boolean; brightness?: number }) {
    // Implement device control logic
    console.log('Controlling device:', command);
  }

  // Update characteristic from device state
  updateState(power: boolean, brightness: number) {
    this.powerOn = power;
    this.brightness = brightness;

    // Notify HomeKit of state change
    this.lightbulbService
      .getCharacteristic(Characteristic.On)!
      .updateValue(power);

    this.lightbulbService
      .getCharacteristic(Characteristic.Brightness)!
      .updateValue(brightness);
  }

  private generateMacAddress(uuid: string): string {
    // Generate valid MAC address from UUID
    const hex = uuid.replace(/-/g, '');
    return `${hex.substring(0, 2)}:${hex.substring(2, 4)}:${hex.substring(4, 6)}:` +
           `${hex.substring(6, 8)}:${hex.substring(8, 10)}:${hex.substring(10, 12)}`;
  }

  destroy() {
    this.accessory.unpublish();
  }
}
```

## Bridge Implementation

A bridge exposes multiple accessories through a single pairing:

```typescript
import {
  Accessory,
  Bridge,
  Categories,
  Characteristic,
  Service,
  uuid,
} from 'hap-nodejs';

export class MyBridge {
  private bridge: Bridge;
  private accessories: Map<string, Accessory> = new Map();

  constructor(name: string) {
    // Create bridge
    this.bridge = new Bridge(name, uuid.generate('MyBridge'));

    // Configure bridge information
    this.bridge
      .getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'My Company')
      .setCharacteristic(Characteristic.Model, 'Bridge v1.0')
      .setCharacteristic(Characteristic.SerialNumber, '12345');

    // Publish bridge
    this.bridge.publish({
      username: 'CC:22:3D:E3:CE:F6',
      pincode: '031-45-154',
      port: 51826,
      category: Categories.BRIDGE,
    });

    console.log('Bridge published');
    console.log('Setup code: 031-45-154');
  }

  addAccessory(accessory: Accessory) {
    const uuid = accessory.UUID;

    if (this.accessories.has(uuid)) {
      console.warn(`Accessory ${uuid} already exists`);
      return;
    }

    this.bridge.addBridgedAccessory(accessory);
    this.accessories.set(uuid, accessory);

    console.log(`Added accessory: ${accessory.displayName}`);
  }

  removeAccessory(uuid: string) {
    const accessory = this.accessories.get(uuid);

    if (!accessory) {
      console.warn(`Accessory ${uuid} not found`);
      return;
    }

    this.bridge.removeBridgedAccessory(accessory);
    this.accessories.delete(uuid);

    console.log(`Removed accessory: ${accessory.displayName}`);
  }

  destroy() {
    this.bridge.unpublish();
  }
}

// Usage
const bridge = new MyBridge('My Home Bridge');

// Create accessories
const light1 = new Accessory('Living Room Light', uuid.generate('light-1'));
light1.addService(Service.Lightbulb, 'Living Room Light');

const light2 = new Accessory('Bedroom Light', uuid.generate('light-2'));
light2.addService(Service.Lightbulb, 'Bedroom Light');

// Add to bridge
bridge.addAccessory(light1);
bridge.addAccessory(light2);
```

## Common Service Implementations

### Thermostat

```typescript
const thermostatService = accessory.addService(Service.Thermostat);

thermostatService
  .getCharacteristic(Characteristic.CurrentTemperature)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    callback(null, currentTemp);
  });

thermostatService
  .getCharacteristic(Characteristic.TargetTemperature)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    callback(null, targetTemp);
  })
  .on(CharacteristicEventTypes.SET, (value, callback) => {
    targetTemp = value as number;
    callback();
  });

thermostatService
  .getCharacteristic(Characteristic.CurrentHeatingCoolingState)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    // 0 = Off, 1 = Heating, 2 = Cooling
    callback(null, heatingCoolingState);
  });

thermostatService
  .getCharacteristic(Characteristic.TargetHeatingCoolingState)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    callback(null, targetHeatingCoolingState);
  })
  .on(CharacteristicEventTypes.SET, (value, callback) => {
    targetHeatingCoolingState = value as number;
    callback();
  });
```

### Lock Mechanism

```typescript
const lockService = accessory.addService(Service.LockMechanism);

lockService
  .getCharacteristic(Characteristic.LockCurrentState)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    // 0 = Unsecured, 1 = Secured, 2 = Jammed, 3 = Unknown
    callback(null, lockState);
  });

lockService
  .getCharacteristic(Characteristic.LockTargetState)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    // 0 = Unsecured, 1 = Secured
    callback(null, targetLockState);
  })
  .on(CharacteristicEventTypes.SET, (value, callback) => {
    targetLockState = value as number;

    // Perform lock/unlock
    performLockOperation(targetLockState === 1)
      .then(() => {
        lockState = targetLockState;
        lockService
          .getCharacteristic(Characteristic.LockCurrentState)!
          .updateValue(lockState);
        callback();
      })
      .catch((error) => {
        callback(error);
      });
  });
```

### Contact Sensor

```typescript
const contactService = accessory.addService(Service.ContactSensor);

contactService
  .getCharacteristic(Characteristic.ContactSensorState)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    // 0 = Detected, 1 = Not detected
    callback(null, contactState);
  });

// Update from device
function updateContactState(detected: boolean) {
  contactState = detected ? 0 : 1;
  contactService
    .getCharacteristic(Characteristic.ContactSensorState)!
    .updateValue(contactState);
}
```

### Temperature Sensor

```typescript
const tempService = accessory.addService(Service.TemperatureSensor);

tempService
  .getCharacteristic(Characteristic.CurrentTemperature)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    callback(null, currentTemperature);
  });

// Update from device
function updateTemperature(temp: number) {
  currentTemperature = temp;
  tempService
    .getCharacteristic(Characteristic.CurrentTemperature)!
    .updateValue(temp);
}
```

### Air Quality Sensor

```typescript
const airQualityService = accessory.addService(Service.AirQualitySensor);

airQualityService
  .getCharacteristic(Characteristic.AirQuality)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    // 0 = Unknown, 1 = Excellent, 2 = Good, 3 = Fair, 4 = Inferior, 5 = Poor
    callback(null, airQuality);
  });

airQualityService
  .getCharacteristic(Characteristic.PM2_5Density)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    callback(null, pm25Density);
  });

airQualityService
  .getCharacteristic(Characteristic.VOCDensity)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    callback(null, vocDensity);
  });
```

### Garage Door Opener

```typescript
const garageDoorService = accessory.addService(Service.GarageDoorOpener);

garageDoorService
  .getCharacteristic(Characteristic.CurrentDoorState)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    // 0 = Open, 1 = Closed, 2 = Opening, 3 = Closing, 4 = Stopped
    callback(null, currentDoorState);
  });

garageDoorService
  .getCharacteristic(Characteristic.TargetDoorState)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    // 0 = Open, 1 = Closed
    callback(null, targetDoorState);
  })
  .on(CharacteristicEventTypes.SET, async (value, callback) => {
    targetDoorState = value as number;

    try {
      await controlGarageDoor(targetDoorState === 0 ? 'open' : 'close');
      callback();
    } catch (error) {
      callback(error);
    }
  });

garageDoorService
  .getCharacteristic(Characteristic.ObstructionDetected)!
  .on(CharacteristicEventTypes.GET, (callback) => {
    callback(null, obstructionDetected);
  });
```

## HAP Pairing and Security

### Storage for Pairing Data

HAP-NodeJS requires persistent storage for pairing information:

```typescript
import { AccessoryInfo } from 'hap-nodejs';
import fs from 'fs/promises';
import path from 'path';

class PersistentStorage {
  private storageDir: string;

  constructor(storageDir: string) {
    this.storageDir = storageDir;
  }

  async init() {
    await fs.mkdir(this.storageDir, { recursive: true });
  }

  async saveAccessoryInfo(uuid: string, info: AccessoryInfo) {
    const filepath = path.join(this.storageDir, `${uuid}.json`);
    await fs.writeFile(filepath, JSON.stringify(info, null, 2));
  }

  async loadAccessoryInfo(uuid: string): Promise<AccessoryInfo | null> {
    const filepath = path.join(this.storageDir, `${uuid}.json`);

    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}

// Usage with HAP-NodeJS
import { HAPStorage } from 'hap-nodejs';

HAPStorage.setCustomStoragePath('./persist');
```

### Custom Characteristics

Create custom characteristics for manufacturer-specific features:

```typescript
import { Characteristic, Formats, Perms } from 'hap-nodejs';

class CustomCharacteristic extends Characteristic {
  static readonly UUID = 'CUSTOM-UUID-HERE';

  constructor() {
    super('Custom Setting', CustomCharacteristic.UUID, {
      format: Formats.BOOL,
      perms: [Perms.PAIRED_READ, Perms.PAIRED_WRITE, Perms.NOTIFY],
    });

    this.value = this.getDefaultValue();
  }
}

// Usage
const service = accessory.addService(Service.Lightbulb);
service.addCharacteristic(CustomCharacteristic);
```

## Best Practices

### 1. State Synchronization

Always keep internal state, HAP state, and physical device state in sync:

```typescript
class DeviceController {
  private state = { power: false, brightness: 100 };

  async setPower(value: boolean) {
    // 1. Update internal state
    this.state.power = value;

    // 2. Control physical device
    await this.controlDevice({ power: value });

    // 3. Update HAP
    this.updateHAPState(value);
  }

  // Poll device for state changes
  async pollDevice() {
    const state = await this.fetchDeviceState();

    if (state.power !== this.state.power) {
      this.state.power = state.power;
      this.updateHAPState(state.power);
    }
  }

  private updateHAPState(power: boolean) {
    this.lightbulbService
      .getCharacteristic(Characteristic.On)!
      .updateValue(power);
  }
}
```

### 2. Error Handling

```typescript
.on(CharacteristicEventTypes.SET, async (value, callback) => {
  try {
    await this.controlDevice({ power: value as boolean });
    this.state.power = value as boolean;
    callback(); // Success
  } catch (error) {
    console.error('Failed to control device:', error);
    callback(new Error('Device communication failed'));
  }
});
```

### 3. Unique Identifiers

Use stable UUIDs that persist across restarts:

```typescript
import { uuid } from 'hap-nodejs';
import crypto from 'crypto';

function generateStableUUID(deviceId: string): string {
  // Generate UUID from device ID (stable across restarts)
  const hash = crypto.createHash('sha256').update(deviceId).digest('hex');
  return uuid.generate(`device-${hash}`);
}
```

### 4. Graceful Shutdown

```typescript
process.on('SIGINT', async () => {
  console.log('Shutting down...');

  // Unpublish accessories
  bridge.destroy();

  process.exit(0);
});
```

### 5. Multiple Services

Add multiple services to a single accessory:

```typescript
const accessory = new Accessory('Multi-function Device', uuid);

// Add multiple services
const lightService = accessory.addService(Service.Lightbulb, 'Light');
const fanService = accessory.addService(Service.Fanv2, 'Fan');
const tempService = accessory.addService(Service.TemperatureSensor, 'Temperature');

// Configure each service independently
lightService
  .getCharacteristic(Characteristic.On)!
  .on(CharacteristicEventTypes.SET, handleLightSet);

fanService
  .getCharacteristic(Characteristic.Active)!
  .on(CharacteristicEventTypes.SET, handleFanSet);
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { Accessory, Service, Characteristic, uuid } from 'hap-nodejs';

describe('HAP Accessory', () => {
  it('should create lightbulb accessory', () => {
    const accessory = new Accessory('Test Light', uuid.generate('test'));
    const service = accessory.addService(Service.Lightbulb);

    expect(service).toBeDefined();
    expect(service.getCharacteristic(Characteristic.On)).toBeDefined();
  });

  it('should handle On characteristic', (done) => {
    const accessory = new Accessory('Test Light', uuid.generate('test'));
    const service = accessory.addService(Service.Lightbulb);

    service
      .getCharacteristic(Characteristic.On)!
      .on(CharacteristicEventTypes.SET, (value, callback) => {
        expect(value).toBe(true);
        callback();
        done();
      });

    // Simulate HomeKit request
    service.getCharacteristic(Characteristic.On)!.setValue(true);
  });
});
```

## Debugging

### Enable Debug Logging

```bash
# Set DEBUG environment variable
DEBUG=* node dist/index.js

# HAP-specific logs
DEBUG=HAP-NodeJS:* node dist/index.js

# Accessory-specific logs
DEBUG=HAP-NodeJS:Accessory node dist/index.js
```

### Common Issues

**Accessory not appearing in Home app**:
- Check pincode is correct
- Verify network connectivity
- Ensure Bonjour/mDNS is working
- Check firewall settings

**State not updating**:
- Call `updateValue()` to notify HomeKit
- Verify characteristic is configured with `NOTIFY` permission
- Check internal state is being updated

**Pairing fails**:
- Delete cached pairing data
- Verify MAC address is valid
- Check port is not already in use

## Service & Characteristic Reference

### Common Services
- `Service.AccessoryInformation` - Required on all accessories
- `Service.Lightbulb` - Light bulbs
- `Service.Switch` - Switches
- `Service.Outlet` - Power outlets
- `Service.Thermostat` - Thermostats
- `Service.Fan` / `Service.Fanv2` - Fans
- `Service.GarageDoorOpener` - Garage doors
- `Service.LockMechanism` - Locks
- `Service.MotionSensor` - Motion detection
- `Service.ContactSensor` - Contact/door sensors
- `Service.TemperatureSensor` - Temperature
- `Service.HumiditySensor` - Humidity
- `Service.AirQualitySensor` - Air quality
- `Service.Battery` - Battery status

### Common Characteristics
- `Characteristic.On` - On/off state (bool)
- `Characteristic.Brightness` - Brightness (0-100)
- `Characteristic.Hue` - Color hue (0-360)
- `Characteristic.Saturation` - Color saturation (0-100)
- `Characteristic.ColorTemperature` - White temperature (Kelvin)
- `Characteristic.CurrentTemperature` - Temperature (Celsius)
- `Characteristic.TargetTemperature` - Target temperature
- `Characteristic.RotationSpeed` - Fan speed (0-100)
- `Characteristic.Active` - Active state (0 = Inactive, 1 = Active)

## Resources

- HAP-NodeJS: https://github.com/homebridge/HAP-NodeJS
- HAP-NodeJS Documentation: https://developers.homebridge.io/HAP-NodeJS/
- HomeKit Accessory Protocol Specification: https://developer.apple.com/homekit/
- Service & Characteristic Reference: https://developers.homebridge.io/#/service
