/* eslint-disable max-len */
import {
	type API,
	type Characteristic,
	type DynamicPlatformPlugin,
	type Logging,
	type PlatformAccessory,
	type PlatformConfig,
	type Service
} from 'homebridge';

import { RabbitAirAccessory } from './platformAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

export interface RabbitAirPlatformConfig extends PlatformConfig {
	devices?: Array<{
		name: string;
		host: string;
		token: string;
		port?: number;
	}>;
}


/**
 * RabbitAirPlatform
 * This class is the main constructor for the RabbitAir plugin, responsible for
 * parsing the user config and discovering/registering accessories with Homebridge.
 */



export class RabbitAirPlatform implements DynamicPlatformPlugin {
	public readonly Service: typeof Service;
	public readonly Characteristic: typeof Characteristic;

	// this is used to track restored cached accessories
	public readonly accessories: Map<string, PlatformAccessory> = new Map();
	public readonly discoveredCacheUUIDs: string[] = [];

	constructor (
		public readonly log: Logging,
		public readonly config: RabbitAirPlatformConfig,
		public readonly api: API
	) {
		this.Service = api.hap.Service;
		this.Characteristic = api.hap.Characteristic;



		this.log?.debug?.('Finished initializing platform:', this.config.name);

		// When this event is fired it means Homebridge has restored all cached accessories from disk.
		// Dynamic Platform plugins should only register new accessories after this event was fired,
		// in order to ensure they weren't added to homebridge already. This event can also be used
		// to start discovery of new accessories.
		this.api.on('didFinishLaunching', () => {
			log.debug?.('Executed didFinishLaunching callback');
			// run the method to discover / register your devices as accessories
			this.discoverDevices();
		});
	}

	/**
	 * This function is invoked when homebridge restores cached accessories from disk at startup.
	 * It should be used to set up event handlers for characteristics and update respective values.
	 */
	configureAccessory(accessory: PlatformAccessory) {
		this.log.info?.('Loading accessory from cache:', accessory.displayName);

		// add the restored accessory to the accessories cache, so we can track if it has already been registered
		this.accessories.set(accessory.UUID, accessory);
	}

	/**
	 * Discover and register RabbitAir devices from the platform config.
	 */
	async discoverDevices() {
		// Check if devices are configured
		if (!this.config.devices || this.config.devices.length === 0) {
			this.log.warn(
				'No devices configured. Please add RabbitAir devices to your config.'
			);
			return;
		}

		// loop over the configured devices and register each one if it has not already been registered
		for (const deviceConfig of this.config.devices) {
			// Validate device configuration
			if (!deviceConfig.name || !deviceConfig.host || !deviceConfig.token) {
				this.log.error(
					'Invalid device configuration. Name, host, and token are required:',
					deviceConfig
				);
				continue;
			}

			// generate a unique id for the accessory this should be generated from
			// something globally unique, but constant, for example, the device MAC address
			// For now, we'll use the host + token combination
			const uuid = this.api.hap.uuid.generate(
				deviceConfig.host + deviceConfig.token
			);

			// see if an accessory with the same uuid has already been registered and restored from
			// the cached devices we stored in the `configureAccessory` method above
			const existingAccessory = this.accessories.get(uuid);

			if (existingAccessory) {

				// the accessory already exists
				this.log.info(
					'Restoring existing accessory from cache:',
					existingAccessory.displayName
				);

				// Update accessory context with current config
				existingAccessory.context.device = deviceConfig;
				this.api.updatePlatformAccessories([existingAccessory]);

				// create the accessory handler for the restored accessory
				// this is imported from `platformAccessory.ts`
				new RabbitAirAccessory(this, existingAccessory);

				// it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, e.g.:
				// remove platform accessories when no longer present
				// this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
				// this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
			} else {
				// the accessory does not yet exist, so we need to create it
				this.log.info('Adding new accessory:', deviceConfig.name);

				// create a new accessory
				const accessory = new this.api.platformAccessory(
					deviceConfig.name,
					uuid
				);

				// store a copy of the device object in the `accessory.context`
				// the `context` property can be used to store any data about the accessory you may need
				accessory.context.device = deviceConfig;

				// create the accessory handler for the newly create accessory
				// this is imported from `platformAccessory.ts`
				new RabbitAirAccessory(this, accessory);

				// link the accessory to your platform
				this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
					accessory
				]);
			}

			// push into discoveredCacheUUIDs
			this.discoveredCacheUUIDs.push(uuid);
		}

		// Remove any cached accessories that are no longer in the config
		for (const [uuid, accessory] of Array.from(this.accessories)) {
			if (!this.discoveredCacheUUIDs.includes(uuid)) {
				this.log.info(
					'Removing existing accessory from cache:',
					accessory.displayName
				);
				this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
					accessory
				]);
			}
		}
	}
}
