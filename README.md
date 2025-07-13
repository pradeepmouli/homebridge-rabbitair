# Homebridge RabbitAir Plugin

This plugin allows you to control RabbitAir air purifiers through HomeKit using Homebridge.

## Features

- **Power Control**: Turn your RabbitAir air purifier on and off
- **Mode Selection**: Switch between Auto and Manual modes
- **Fan Speed Control**: Adjust fan speed (Silent, Low, Medium, High, Turbo)
- **Air Quality Monitoring**: Real-time air quality sensor readings
- **Filter Status**: Monitor filter life and receive replacement notifications
- **HomeKit Integration**: Full HomeKit support with Siri voice control

## Installation

1. Install Homebridge if you haven't already: `npm install -g homebridge`
2. Install this plugin: `npm install -g homebridge-rabbitair`
3. Add the plugin to your Homebridge configuration

## Configuration

Add the following to your Homebridge config.json:

```json
{
  "platforms": [
    {
      "platform": "RabbitAir",
      "name": "RabbitAir",
      "devices": [
        {
          "name": "Living Room Air Purifier",
          "host": "192.168.1.100",
          "token": "0123456789ABCDEF0123456789ABCDEF",
          "port": 9009
        }
      ]
    }
  ]
}
```

### Configuration Parameters

- `platform` (required): Must be "RabbitAir"
- `name` (required): Display name for the platform
- `devices` (required): Array of RabbitAir devices
  - `name` (required): Display name for the device
  - `host` (required): IP address or hostname of the device
  - `token` (required): 32-character access token from the RabbitAir app
  - `port` (optional): UDP port for communication (default: 9009)

## Getting the Access Token

To get the access token for your RabbitAir device:

1. Open the RabbitAir mobile app
2. Go to the device control page
3. Tap the "Edit" button
4. Quickly tap "Serial Number" several times until you see the access token

The token is a 32-character hexadecimal string (e.g., `0123456789ABCDEF0123456789ABCDEF`).

## Supported Devices

This plugin is based on the [python-rabbitair](https://github.com/rabbit-air/python-rabbitair) library and supports the same RabbitAir models:

- MinusA2
- BioGS  
- A3

## HomeKit Services

Each RabbitAir device will appear in HomeKit with the following services:

- **Air Purifier Service**
  - Active (on/off)
  - Current Air Purifier State (inactive/idle/purifying)
  - Target Air Purifier State (manual/auto)
  - Rotation Speed (fan speed)
  - Filter Change Indication
  - Filter Life Level

- **Air Quality Sensor Service**
  - Air Quality (excellent/good/fair/poor)

## Troubleshooting

- Ensure your RabbitAir device is connected to the same network as your Homebridge server
- Verify the access token is correct and 32 characters long
- Check that the device IP address is correct and reachable
- Make sure no firewall is blocking UDP port 9009

## Development

This plugin is built with TypeScript and uses the Homebridge Plugin Template. To contribute:

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Run linting: `npm run lint`

## License

This project is licensed under the Apache 2.0 License.

## Credits

Based on the [python-rabbitair](https://github.com/rabbit-air/python-rabbitair) library by the RabbitAir team.