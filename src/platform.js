'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P((resolve) => {
			resolve(value); 
		}); 
	}
	return new (P || (P = Promise))((resolve, reject) => {
		function fulfilled(value) {
			try {
				step(generator.next(value)); 
			} catch (e) {
				reject(e); 
			} 
		}
		function rejected(value) {
			try {
				step(generator.throw(value)); 
			} catch (e) {
				reject(e); 
			} 
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); 
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var __generator = (this && this.__generator) || function (thisArg, body) {
	var _ = { label: 0, sent: function() {
			if (t[0] & 1) {
				throw t[1];
			} return t[1]; 
		}, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
	return g.next = verb(0), g.throw = verb(1), g.return = verb(2), typeof Symbol === 'function' && (g[Symbol.iterator] = function() {
		return this; 
	}), g;
	function verb(n) {
		return function (v) {
			return step([n, v]); 
		}; 
	}
	function step(op) {
		if (f) {
			throw new TypeError('Generator is already executing.');
		}
		while (g && (g = 0, op[0] && (_ = 0)), _) {
			try {
				if (f = 1, y && (t = op[0] & 2 ? y.return : op[0] ? y.throw || ((t = y.return) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) {
					return t;
				}
				if (y = 0, t) {
					op = [op[0] & 2, t.value];
				}
				switch (op[0]) {
					case 0: case 1: t = op; break;
					case 4: _.label++; return { value: op[1], done: false };
					case 5: _.label++; y = op[1]; op = [0]; continue;
					case 7: op = _.ops.pop(); _.trys.pop(); continue;
					default:
						if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
							_ = 0; continue; 
						}
						if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
							_.label = op[1]; break; 
						}
						if (op[0] === 6 && _.label < t[1]) {
							_.label = t[1]; t = op; break; 
						}
						if (t && _.label < t[2]) {
							_.label = t[2]; _.ops.push(op); break; 
						}
						if (t[2]) {
							_.ops.pop();
						}
						_.trys.pop(); continue;
				}
				op = body.call(thisArg, _);
			} catch (e) {
				op = [6, e]; y = 0; 
			} finally {
				f = t = 0; 
			}
		}
		if (op[0] & 5) {
			throw op[1];
		} return { value: op[0] ? op[1] : void 0, done: true };
	}
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.RabbitAirPlatform = void 0;
var platformAccessory_js_1 = require('./platformAccessory.js');
var settings_js_1 = require('./settings.js');
var hap_fluent_1 = require('hap-fluent');
var rabbitair_client_js_1 = require('./rabbitair-client.js');
/**
 * RabbitAirPlatform
 * This class is the main constructor for the RabbitAir plugin, responsible for
 * parsing the user config and discovering/registering accessories with Homebridge.
 */
var RabbitAirPlatform = /** @class */ (function () {
	function RabbitAirPlatform(log, config, api) {
		var _this = this;
		var _a, _b;
		this.log = log;
		this.config = config;
		this.api = api;
		// this is used to track restored cached accessories
		this.accessories = new Map();
		this.discoveredCacheUUIDs = [];
		this.Service = api.hap.Service;
		this.Characteristic = api.hap.Characteristic;
		(_b = (_a = this.log) === null || _a === void 0 ? void 0 : _a.debug) === null || _b === void 0 ? void 0 : _b.call(_a, 'Finished initializing platform:', this.config.name);
		// When this event is fired it means Homebridge has restored all cached accessories from disk.
		// Dynamic Platform plugins should only register new accessories after this event was fired,
		// in order to ensure they weren't added to homebridge already. This event can also be used
		// to start discovery of new accessories.
		this.api.on('didFinishLaunching', () => {
			var _a;
			(_a = log.debug) === null || _a === void 0 ? void 0 : _a.call(log, 'Executed didFinishLaunching callback');
			// run the method to discover / register your devices as accessories
			_this.discoverDevices();
		});
	}
	/**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to set up event handlers for characteristics and update respective values.
     */
	RabbitAirPlatform.prototype.configureAccessory = function (accessory) {
		var _a, _b;
		(_b = (_a = this.log).info) === null || _b === void 0 ? void 0 : _b.call(_a, 'Loading accessory from cache:', accessory.displayName);
		(0, hap_fluent_1.initializeAccessory)(accessory, {
			accessoryInformation: { manufacturer: 'RabbitAir', model: 'RabbitAir A3', serialNumber: accessory.UUID },
			airPurifier: { active: 1 /* Enums.Active.Active */, currentAirPurifierState: 0, targetAirPurifierState: 0, rotationSpeed: 0, lockPhysicalControls: 1 /* Enums.LockPhysicalControls.ControlLockEnabled */ }
		});
		// add the restored accessory to the accessories cache, so we can track if it has already been registered
		this.accessories.set(accessory.UUID, accessory);
	};
	/**
     * Discover and register RabbitAir devices from the platform config.
     */
	RabbitAirPlatform.prototype.discoverDevices = function () {
		return __awaiter(this, void 0, void 0, function () {
			var _i, _a, deviceConfig, uuid, existingAccessory, c, i, s, accessory, _b, _c, _d, uuid, accessory;
			return __generator(this, function (_e) {
				switch (_e.label) {
					case 0:
						// Check if devices are configured
						if (!this.config.devices || this.config.devices.length === 0) {
							this.log.warn('No devices configured. Please add RabbitAir devices to your config.');
							return [2 /*return*/];
						}
						_i = 0, _a = this.config.devices;
						_e.label = 1;
					case 1:
						if (!(_i < _a.length)) {
							return [3 /*break*/, 7];
						}
						deviceConfig = _a[_i];
						// Validate device configuration
						if (!deviceConfig.name || !deviceConfig.host || !deviceConfig.token) {
							this.log.error('Invalid device configuration. Name, host, and token are required:', deviceConfig);
							return [3 /*break*/, 6];
						}
						uuid = this.api.hap.uuid.generate(deviceConfig.host + deviceConfig.token);
						existingAccessory = this.accessories.get(uuid);
						if (!existingAccessory) {
							return [3 /*break*/, 4];
						}
						// the accessory already exists
						this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
						c = new rabbitair_client_js_1.RabbitAirClient(deviceConfig, this.log);
						c.connect();
						return [4 /*yield*/, c.getInfo()];
					case 2:
						i = _e.sent();
						return [4 /*yield*/, c.getState()];
					case 3:
						s = _e.sent();
						(0, hap_fluent_1.initializeAccessory)(existingAccessory, {
							accessoryInformation: { manufacturer: 'RabbitAir', model: i.model, serialNumber: deviceConfig.token },
							airPurifier: { active: 1 /* Enums.Active.Active */, currentAirPurifierState: 0, targetAirPurifierState: 0, rotationSpeed: s.speed, lockPhysicalControls: 1 /* Enums.LockPhysicalControls.ControlLockEnabled */ }
						});
						// if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
						existingAccessory.context.device = deviceConfig;
						this.api.updatePlatformAccessories([existingAccessory]);
						// create the accessory handler for the restored accessory
						// this is imported from `platformAccessory.ts`
						new platformAccessory_js_1.RabbitAirAccessory(this, existingAccessory);
						// if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
						existingAccessory.context.device = deviceConfig;
						this.api.updatePlatformAccessories([existingAccessory]);
						// create the accessory handler for the restored accessory
						// this is imported from `platformAccessory.ts`
						new platformAccessory_js_1.RabbitAirAccessory(this, existingAccessory);
						return [3 /*break*/, 5];
					case 4:
						// the accessory does not yet exist, so we need to create it
						this.log.info('Adding new accessory:', deviceConfig.name);
						accessory = new this.api.platformAccessory(deviceConfig.name, uuid);
						// store a copy of the device object in the `accessory.context`
						// the `context` property can be used to store any data about the accessory you may need
						accessory.context.device = deviceConfig;
						// create the accessory handler for the newly create accessory
						// this is imported from `platformAccessory.ts`
						new platformAccessory_js_1.RabbitAirAccessory(this, accessory);
						// link the accessory to your platform
						this.api.registerPlatformAccessories(settings_js_1.PLUGIN_NAME, settings_js_1.PLATFORM_NAME, [
							accessory
						]);
						_e.label = 5;
					case 5:
						// push into discoveredCacheUUIDs
						this.discoveredCacheUUIDs.push(uuid);
						_e.label = 6;
					case 6:
						_i++;
						return [3 /*break*/, 1];
					case 7:
						// Remove any cached accessories that are no longer in the config
						for (_b = 0, _c = this.accessories; _b < _c.length; _b++) {
							_d = _c[_b], uuid = _d[0], accessory = _d[1];
							if (!this.discoveredCacheUUIDs.includes(uuid)) {
								this.log.info('Removing existing accessory from cache:', accessory.displayName);
								this.api.unregisterPlatformAccessories(settings_js_1.PLUGIN_NAME, settings_js_1.PLATFORM_NAME, [
									accessory
								]);
							}
						}
						return [2 /*return*/];
				}
			});
		});
	};
	return RabbitAirPlatform;
}());
exports.RabbitAirPlatform = RabbitAirPlatform;
