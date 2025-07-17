import {
	type CharacteristicValue,
	type PlatformAccessory,
	type Service
} from 'homebridge';

import type { RabbitAirPlatform } from './platform.js';
import {
	RabbitAirClient,
	RabbitAirMode,
	RabbitAirQuality,
	RabbitAirSpeed
} from './rabbitair-client.js';

/**
 * RabbitAir Platform Accessory
 * An instance of this class is created for each RabbitAir air purifier.
 */
export class RabbitAirAccessory {
	private service: Service;
	private client: RabbitAirClient;
	private updateInterval: NodeJS.Timeout | null = null;
	private initialUpdateTimeout: NodeJS.Timeout | null = null;

	private currentState = {
		active: false,
		currentAirPurifierState: 0, // Will be set in constructor
		targetAirPurifierState: 0, // Will be set in constructor
		rotationSpeed: 0,
		filterChangeIndication: 0, // Will be set in constructor
		filterLifeLevel: 100,
		airQuality: 0 // Will be set in constructor
	};

	constructor(
		private readonly platform: RabbitAirPlatform,
		private readonly accessory: PlatformAccessory
	) {
		// Initialize state values now that platform is available
		this.currentState.currentAirPurifierState =
			this.platform.Characteristic.CurrentAirPurifierState.INACTIVE;
		this.currentState.targetAirPurifierState =
			this.platform.Characteristic.TargetAirPurifierState.MANUAL;
		this.currentState.filterChangeIndication =
			this.platform.Characteristic.FilterChangeIndication.FILTER_OK;
		this.currentState.airQuality =
			this.platform.Characteristic.AirQuality.UNKNOWN;

		// Initialize the RabbitAir client
		this.client = new RabbitAirClient(
			{
				host: accessory.context.device.host,
				token: accessory.context.device.token,
				port: accessory.context.device.port
			},
			this.platform.log
		);

		// Set accessory information
		this.accessory
			.getService(this.platform.Service.AccessoryInformation)!
			.setCharacteristic(this.platform.Characteristic.Manufacturer, 'RabbitAir')
			.setCharacteristic(this.platform.Characteristic.Model, 'Air Purifier')
			.setCharacteristic(
				this.platform.Characteristic.SerialNumber,
				accessory.context.device.host
			);

		// Get or create the Air Purifier service
		this.service =
			this.accessory.getService(this.platform.Service.AirPurifier) ||
			this.accessory.addService(this.platform.Service.AirPurifier);

		// Set the service name
		this.service.setCharacteristic(
			this.platform.Characteristic.Name,
			accessory.context.device.name
		);

		// Register handlers for required characteristics
		this.service
			.getCharacteristic(this.platform.Characteristic.Active)
			.onSet(this.setActive.bind(this))
			.onGet(this.getActive.bind(this));

		this.service
			.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
			.onGet(this.getCurrentAirPurifierState.bind(this));

		this.service
			.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
			.onSet(this.setTargetAirPurifierState.bind(this))
			.onGet(this.getTargetAirPurifierState.bind(this));

		// Register handlers for optional characteristics
		this.service
			.getCharacteristic(this.platform.Characteristic.RotationSpeed)
			.setProps({
				minValue: 0,
				maxValue: 5,
				minStep: 1
			})
			.onSet(this.setRotationSpeed.bind(this))
			.onGet(this.getRotationSpeed.bind(this));

		this.service
			.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
			.onGet(this.getFilterChangeIndication.bind(this));

		this.service
			.getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
			.onGet(this.getFilterLifeLevel.bind(this));

		// Add Air Quality Sensor service
		const airQualityService =
			this.accessory.getService(this.platform.Service.AirQualitySensor) ||
			this.accessory.addService(this.platform.Service.AirQualitySensor);

		airQualityService
			.getCharacteristic(this.platform.Characteristic.AirQuality)
			.onGet(this.getAirQuality.bind(this));

		// Start periodic updates
		this.startPeriodicUpdates();
	}

	/**
	 * Start periodic updates of device state
	 */
	private startPeriodicUpdates() {
		// Update state every 30 seconds
		this.updateInterval = setInterval(async () => {
			try {
				await this.updateDeviceState();
			} catch (error) {
				this.platform.log.error('Error updating device state:', error);
			}
		}, 30000);

		// Initial state update
		this.initialUpdateTimeout = setTimeout(async () => {
			try {
				await this.updateDeviceState();
			} catch (error) {
				this.platform.log.error('Error in initial state update:', error);
			}
		}, 5000);
	}

	/**
	 * Stop periodic updates and cleanup resources
	 */
	private stopPeriodicUpdates() {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
		if (this.initialUpdateTimeout) {
			clearTimeout(this.initialUpdateTimeout);
			this.initialUpdateTimeout = null;
		}
	}

	/**
	 * Cleanup resources
	 */
	async cleanup() {
		this.platform.log.debug('Cleaning up RabbitAir accessory');
		this.stopPeriodicUpdates();

		try {
			await this.client.shutdown();
		} catch (error) {
			this.platform.log.error('Error during client shutdown:', error);
		}
	}

	/**
	 * Update device state from RabbitAir device
	 */
	private async updateDeviceState() {
		try {
			const state = await this.client.getState();

			// Update internal state
			this.currentState.active = state.power || false;

			// Update current air purifier state based on power and speed
			if (!state.power) {
				this.currentState.currentAirPurifierState =
					this.platform.Characteristic.CurrentAirPurifierState.INACTIVE;
			} else if (state.speed === RabbitAirSpeed.SuperSilent) {
				this.currentState.currentAirPurifierState =
					this.platform.Characteristic.CurrentAirPurifierState.IDLE;
			} else {
				this.currentState.currentAirPurifierState =
					this.platform.Characteristic.CurrentAirPurifierState.PURIFYING_AIR;
			}

			// Update target air purifier state based on mode
			this.currentState.targetAirPurifierState =
				state.mode === RabbitAirMode.Auto
					? this.platform.Characteristic.TargetAirPurifierState.AUTO
					: this.platform.Characteristic.TargetAirPurifierState.MANUAL;

			// Update rotation speed
			this.currentState.rotationSpeed = state.speed || 0;

			// Update filter status
			if (state.filterReplacement) {
				this.currentState.filterChangeIndication =
					this.platform.Characteristic.FilterChangeIndication.CHANGE_FILTER;
			} else {
				this.currentState.filterChangeIndication =
					this.platform.Characteristic.FilterChangeIndication.FILTER_OK;
			}

			// Update filter life level (convert from minutes to percentage)
			if (state.filterLife !== undefined) {
				this.currentState.filterLifeLevel = Math.max(
					0,
					Math.min(100, Math.round((state.filterLife / 525600) * 100))
				);
			}

			// Update air quality
			if (state.quality !== undefined) {
				switch (state.quality) {
					case RabbitAirQuality.Lowest:
					case RabbitAirQuality.Low:
						this.currentState.airQuality =
							this.platform.Characteristic.AirQuality.POOR;
						break;
					case RabbitAirQuality.Medium:
						this.currentState.airQuality =
							this.platform.Characteristic.AirQuality.FAIR;
						break;
					case RabbitAirQuality.High:
						this.currentState.airQuality =
							this.platform.Characteristic.AirQuality.GOOD;
						break;
					case RabbitAirQuality.Highest:
						this.currentState.airQuality =
							this.platform.Characteristic.AirQuality.EXCELLENT;
						break;
					default:
						this.currentState.airQuality =
							this.platform.Characteristic.AirQuality.UNKNOWN;
				}
			}

			// Update HomeKit characteristics
			this.service.updateCharacteristic(
				this.platform.Characteristic.Active,
				this.currentState.active
			);
			this.service.updateCharacteristic(
				this.platform.Characteristic.CurrentAirPurifierState,
				this.currentState.currentAirPurifierState
			);
			this.service.updateCharacteristic(
				this.platform.Characteristic.TargetAirPurifierState,
				this.currentState.targetAirPurifierState
			);
			this.service.updateCharacteristic(
				this.platform.Characteristic.RotationSpeed,
				this.currentState.rotationSpeed
			);
			this.service.updateCharacteristic(
				this.platform.Characteristic.FilterChangeIndication,
				this.currentState.filterChangeIndication
			);
			this.service.updateCharacteristic(
				this.platform.Characteristic.FilterLifeLevel,
				this.currentState.filterLifeLevel
			);

			const airQualityService = this.accessory.getService(
				this.platform.Service.AirQualitySensor
			);
			if (airQualityService) {
				airQualityService.updateCharacteristic(
					this.platform.Characteristic.AirQuality,
					this.currentState.airQuality
				);
			}
		} catch (error) {
			this.platform.log.error('Failed to update device state:', error);
		}
	}

	// Characteristic handlers

	async setActive(value: CharacteristicValue) {
		const active = value as boolean;
		this.platform.log.debug('Set Active ->', active);

		try {
			await this.client.setState({ power: active });

			this.currentState.active = active;
			if (!active) {
				this.currentState.currentAirPurifierState =
					this.platform.Characteristic.CurrentAirPurifierState.INACTIVE;
				this.service.updateCharacteristic(
					this.platform.Characteristic.CurrentAirPurifierState,
					this.currentState.currentAirPurifierState
				);
			}
		} catch (error) {
			this.platform.log.error('Failed to set active state:', error);
			throw new this.platform.api.hap.HapStatusError(
				this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
			);
		}
	}

	async getActive(): Promise<CharacteristicValue> {
		this.platform.log.debug('Get Active ->', this.currentState.active);
		return this.currentState.active;
	}

	async getCurrentAirPurifierState(): Promise<CharacteristicValue> {
		this.platform.log.debug(
			'Get Current Air Purifier State ->',
			this.currentState.currentAirPurifierState
		);
		return this.currentState.currentAirPurifierState;
	}

	async setTargetAirPurifierState(value: CharacteristicValue) {
		const targetState = value as number;
		this.platform.log.debug('Set Target Air Purifier State ->', targetState);

		try {
			if (
				targetState === this.platform.Characteristic.TargetAirPurifierState.AUTO
			) {
				await this.client.setState({ mode: RabbitAirMode.Auto });
			} else {
				await this.client.setState({ mode: RabbitAirMode.Manual });
			}

			this.currentState.targetAirPurifierState = targetState;
		} catch (error) {
			this.platform.log.error(
				'Failed to set target air purifier state:',
				error
			);
			throw new this.platform.api.hap.HapStatusError(
				this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
			);
		}
	}

	async getTargetAirPurifierState(): Promise<CharacteristicValue> {
		this.platform.log.debug(
			'Get Target Air Purifier State ->',
			this.currentState.targetAirPurifierState
		);
		return this.currentState.targetAirPurifierState;
	}

	async setRotationSpeed(value: CharacteristicValue) {
		const speed = value as number;
		this.platform.log.debug('Set Rotation Speed ->', speed);

		try {
			await this.client.setState({ speed: speed as RabbitAirSpeed });

			this.currentState.rotationSpeed = speed;
		} catch (error) {
			this.platform.log.error('Failed to set rotation speed:', error);
			throw new this.platform.api.hap.HapStatusError(
				this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
			);
		}
	}

	async getRotationSpeed(): Promise<CharacteristicValue> {
		this.platform.log.debug(
			'Get Rotation Speed ->',
			this.currentState.rotationSpeed
		);
		return this.currentState.rotationSpeed;
	}

	async getFilterChangeIndication(): Promise<CharacteristicValue> {
		this.platform.log.debug(
			'Get Filter Change Indication ->',
			this.currentState.filterChangeIndication
		);
		return this.currentState.filterChangeIndication;
	}

	async getFilterLifeLevel(): Promise<CharacteristicValue> {
		this.platform.log.debug(
			'Get Filter Life Level ->',
			this.currentState.filterLifeLevel
		);
		return this.currentState.filterLifeLevel;
	}

	async getAirQuality(): Promise<CharacteristicValue> {
		this.platform.log.debug('Get Air Quality ->', this.currentState.airQuality);
		return this.currentState.airQuality;
	}
}
