# Behavioral Snapshot

**Refactor ID**: refactor-001  
**Created**: 2025-12-30  
**Purpose**: Document observable behaviors that MUST NOT CHANGE during refactoring

## Observable Behaviors (IMMUTABLE)

This document defines the behaviors visible to users, HomeKit, and external systems. **Refactoring must not change any of these behaviors.**

### 1. HomeKit Service Exposure

#### Air Purifier Service

**Observable Behavior**: When plugin starts, each RabbitAir device appears in HomeKit as an Air Purifier accessory.

**Characteristics**:
| Characteristic | Type | R/W | Observable Behavior |
|---|---|---|---|
| Active | boolean | R/W | User can turn device on/off from HomeKit |
| CurrentAirPurifierState | enum | R | 0=inactive, 1=idle, 2=purifying |
| TargetAirPurifierState | enum | R/W | 0=manual, 1=auto |
| RotationSpeed | percent 0-100 | R/W | User can adjust fan speed 0-100% |
| FilterLifeLevel | percent 0-100 | R | Shows remaining filter life % |
| FilterChangeIndication | enum | R | 0=OK, 1=replace filter needed |

#### Air Quality Sensor Service

**Observable Behavior**: Each device exposes air quality readings.

| Characteristic | Observable Behavior |
|---|---|
| AirQuality | Values 0-4: excellent/good/fair/poor/unknown |

### 2. Device Control Flow

#### Turn On/Off
- User taps power in Home app
- Device turns on/off within 2 seconds
- HomeKit reflects actual device state

#### Change Mode (Manual ↔ Auto)
- User sets TargetAirPurifierState
- Device mode changes
- HomeKit characteristic updates

#### Adjust Fan Speed
- User moves slider 0-100%
- Plugin maps to device levels: Silent/Low/Medium/High/Turbo
- Device adjusts fan to match

### 3. Device Polling & Updates

**Filter Status Polling**: Plugin periodically polls device filter life
- When filter life < 10%: FilterChangeIndication = 1
- HomeKit shows "Change Filter" notification

**Air Quality Updates**: Plugin polls device and updates HomeKit
- Quality value reflects actual sensor state

**State Consistency**: HomeKit always matches device state

### 4. Error Handling

#### Device Unreachable
- Plugin retries up to 3 times over 9 seconds
- If no response: operation times out
- Device remains in HomeKit
- User can retry

#### Invalid Configuration
- Invalid devices skipped with error logged
- Valid devices still appear in HomeKit
- Plugin continues running

### 5. Plugin Lifecycle

#### Startup
- Plugin loads configuration
- Creates accessories for each device
- Starts polling device state
- Accessories appear in Home within 5 seconds

#### Accessory Registration
- Accessory UUID matches device
- UUID persists across restarts
- Same device always maps to same HomeKit accessory

#### Shutdown & Restart
- Plugin shuts down gracefully
- Accessories reconnect within 10 seconds
- Settings and automations persist

### 6. Multi-Device Scenarios

**Multiple Devices**: Each device independent, no interference
**Device Naming**: Names from config appear in HomeKit

---

## Immutable Contracts

### HomeKit Service UUIDs
- Air Purifier Service: 000000A7-0000-1000-8000-0026BB765291
- Air Quality Sensor Service: 0000008D-0000-1000-8000-0026BB765291

### Characteristic Value Ranges
- RotationSpeed: 0-100 (percent)
- FilterLifeLevel: 0-100 (percent)
- CurrentAirPurifierState: 0, 1, 2
- TargetAirPurifierState: 0, 1
- AirQuality: 0, 1, 2, 3, 4
- FilterChangeIndication: 0, 1

### UDP Protocol Behavior
- Timeout: 3 seconds per command
- Retry: 3 attempts on failure
- Port: 9009 (configurable)
- Speed mapping: Silent/Low/Medium/High/Turbo

### Configuration Schema
```json
{
  "platform": "RabbitAir",
  "devices": [
    {
      "name": "Device name",
      "host": "192.168.1.100",
      "token": "32-character-hex-string",
      "port": 9009
    }
  ]
}
```

---

## Verification Checklist

**Before Refactoring** (Baseline):
- [ ] All observable behaviors tested
- [ ] Test suite passing 100%
- [ ] Baseline metrics captured

**After Refactoring** (Validation):
- [ ] All original tests pass without modification
- [ ] All observable behaviors identical
- [ ] No regressions observed

---

## Notes

- **Golden Truth**: These behaviors are immutable. Refactoring succeeds only if all remain unchanged.
- **External Contract**: From user perspective, nothing should feel different.
- **Internal Only**: Implementation changes are internal; external contract is immutable.
