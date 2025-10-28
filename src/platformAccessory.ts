/* eslint-disable @typescript-eslint/no-empty-object-type */
import { type CharacteristicValue, type PlatformAccessory } from 'homebridge';
import type { RabbitAirPlatform } from './platform.js';
import {
	RabbitAirClient,
	RabbitAirMode,
	RabbitAirQuality,
	RabbitAirSpeed
} from './rabbitair-client.js';

import type { AccessoryInformation, AirPurifier, AirQualitySensor, FilterMaintenance } from 'hap-fluent';
import { AccessoryHandler, Enums } from 'hap-fluent';


/**
 * RabbitAir Platform Accessory
 * An instance of this class is created for each RabbitAir air purifier.
 */
export class RabbitAirAccessory extends AccessoryHandler<{}, [AirPurifier, AirQualitySensor, AccessoryInformation, FilterMaintenance]> {
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



	constructor (
		public readonly platform: RabbitAirPlatform,
		public readonly accessory: PlatformAccessory
	) {
		super(platform, accessory);

		// Initialize services

		// Initialize state values now that platform is available

		// Initialize the RabbitAir client
		this.client = new RabbitAirClient(
			{
				host: accessory.context.device.host,
				token: accessory.context.device.token,
				port: accessory.context.device.port
			},
			this.platform.log
		);
		this.cleanup();

		// Start periodic updates
		this.startPeriodicUpdates();

		this.initialize({
			accessoryInformation: {},
			airPurifier: {
				active: this.currentState.active ? Enums.Active.Active : Enums.Active.Inactive,
				currentAirPurifierState: this.currentState.currentAirPurifierState,
				targetAirPurifierState: this.currentState.targetAirPurifierState,
				rotationSpeed: this.currentState.rotationSpeed

			},
			airQualitySensor: {
				airQuality: this.currentState.airQuality,
				vocDensity: 0,
				pm25Density: 0,
				pm10Density: 0
			},
			filterMaintenance: {
				filterChangeIndication: this.currentState.filterChangeIndication,
				filterLifeLevel: this.currentState.filterLifeLevel
			}
		});

		// Defer service configuration to next tick to ensure services are initialized
		process.nextTick(() => {
			this.configureServices();
		});
	}

	/**
	 * Configure service characteristics and event handlers
	 */
	private configureServices() {
		// Type assertion to help TypeScript understand the services are initialized
		const services = this.services as unknown as {
			airQualitySensor?: { characteristics?: { AirQuality?: { setProps: (props: unknown) => void; }; }; };
			airPurifier?: { characteristics?: { Active?: { onSet: (handler: (value: unknown) => Promise<void>) => void; }; }; };
		};

		if (services?.airQualitySensor?.characteristics?.AirQuality) {
			services.airQualitySensor.characteristics.AirQuality.setProps({ minValue: 0, maxValue: 6 });
		}
		if (services?.airPurifier?.characteristics?.Active) {
			services.airPurifier.characteristics.Active.onSet(async (value: unknown) => {
				await this.client.setState({ power: value ? true : false });
			});
		}
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
			const services = this.services as unknown as {
				airPurifier?: {
					active?: unknown;
					currentAirPurifierState?: unknown;
					targetAirPurifierState?: unknown;
					rotationSpeed?: unknown;
				};
				airQualitySensor?: { airQuality?: unknown; };
				filterMaintenance?: {
					filterLifeLevel?: unknown;
					filterChangeIndication?: unknown;
				};
			};

			services.airPurifier.active = state.power ? Enums.Active.Active : Enums.Active.Inactive;
			// Update internal stat


			// Update current air purifier state based on power and speed
			if (!state.power) {
				services.airPurifier.currentAirPurifierState =
					Enums.CurrentAirPurifierState.Inactive;
			} else if (state.idle === RabbitAirSpeed.SuperSilent) {
				services.airPurifier.currentAirPurifierState = Enums.CurrentAirPurifierState.Idle;
			} else {
				services.airPurifier.currentAirPurifierState = Enums.CurrentAirPurifierState.PurifyingAir;
			}

			services.airPurifier.targetAirPurifierState =
				state.mode === RabbitAirMode.Auto
					? Enums.TargetAirPurifierState.Auto
					: Enums.TargetAirPurifierState.Manual;

			// Update target air purifier state based on mode

			// Update rotation speed
			services.airPurifier.rotationSpeed = state.speed || 0;

			// Update filter status
			if (state.filterReplacement) {
				services.filterMaintenance.filterChangeIndication =
					Enums.FilterChangeIndication.ChangeFilter;
			} else {
				services.filterMaintenance.filterChangeIndication =
					Enums.FilterChangeIndication.FilterOk;
			}

			// Update filter life level (convert from minutes to percentage)
			if (state.filterLife !== undefined) {
				services.filterMaintenance.filterLifeLevel = Math.max(
					0,
					Math.min(100, Math.round((state.filterLife / 525600) * 100))
				);
			}

			// Update air quality
			if (state.quality !== undefined) {
				switch (state.quality) {
					case RabbitAirQuality.Lowest:
					case RabbitAirQuality.Low:
						services.airQualitySensor.airQuality =
							Enums.AirQuality.Poor;
						break;
					case RabbitAirQuality.Medium:
						services.airQualitySensor.airQuality =
							Enums.AirQuality.Fair;
						break;
					case RabbitAirQuality.High:
						services.airQualitySensor.airQuality =
							Enums.AirQuality.Good;
						break;
					case RabbitAirQuality.Highest:
						services.airQualitySensor.airQuality =
							Enums.AirQuality.Excellent;
						break;
					default:
						services.airQualitySensor.airQuality =
							Enums.AirQuality.Unknown;
				}
			}


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
