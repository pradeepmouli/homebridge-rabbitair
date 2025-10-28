'use strict';
var __extends = (this && this.__extends) || (function () {
	var extendStatics = function (d, b) {
		extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) {
            	d.__proto__ = b; 
            }) ||
            function (d, b) {
            	for (var p in b) {
            		if (Object.prototype.hasOwnProperty.call(b, p)) {
            			d[p] = b[p];
            		}
            	} 
            };
		return extendStatics(d, b);
	};
	return function (d, b) {
		if (typeof b !== 'function' && b !== null) {
			throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
		}
		extendStatics(d, b);
		function __() {
			this.constructor = d; 
		}
		d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
})();
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
exports.RabbitAirAccessory = void 0;
var rabbitair_client_js_1 = require('./rabbitair-client.js');
var hap_fluent_1 = require('hap-fluent');
/**
 * RabbitAir Platform Accessory
 * An instance of this class is created for each RabbitAir air purifier.
 */
var RabbitAirAccessory = /** @class */ (function (_super) {
	__extends(RabbitAirAccessory, _super);
	function RabbitAirAccessory(platform, accessory) {
		var _this = _super.call(this, platform, accessory) || this;
		_this.platform = platform;
		_this.accessory = accessory;
		_this.updateInterval = null;
		_this.initialUpdateTimeout = null;
		_this.currentState = {
			active: false,
			currentAirPurifierState: 0, // Will be set in constructor
			targetAirPurifierState: 0, // Will be set in constructor
			rotationSpeed: 0,
			filterChangeIndication: 0, // Will be set in constructor
			filterLifeLevel: 100,
			airQuality: 0 // Will be set in constructor
		};
		// Initialize services
		// Initialize state values now that platform is available
		// Initialize the RabbitAir client
		_this.client = new rabbitair_client_js_1.RabbitAirClient({
			host: accessory.context.device.host,
			token: accessory.context.device.token,
			port: accessory.context.device.port
		}, _this.platform.log);
		_this.cleanup();
		// Start periodic updates
		_this.startPeriodicUpdates();
		_this.initialize({
			accessoryInformation: {},
			airPurifier: {
				active: _this.currentState.active ? 1 /* Enums.Active.Active */ : 0 /* Enums.Active.Inactive */,
				currentAirPurifierState: _this.currentState.currentAirPurifierState,
				targetAirPurifierState: _this.currentState.targetAirPurifierState,
				rotationSpeed: _this.currentState.rotationSpeed
			},
			airQualitySensor: {
				airQuality: _this.currentState.airQuality,
				vocDensity: 0,
				pm25Density: 0,
				pm10Density: 0
			},
			filterMaintenance: {
				filterChangeIndication: _this.currentState.filterChangeIndication,
				filterLifeLevel: _this.currentState.filterLifeLevel
			}
		});
		_this.services.airQualitySensor.characteristics.AirQuality.setProps({ minValue: 0, maxValue: 6 });
		_this.services.airPurifier.characteristics.Active.onSet((value) => {
			return __awaiter(_this, void 0, void 0, function () {
				return __generator(this, function (_a) {
					switch (_a.label) {
						case 0: return [4 /*yield*/, this.client.setState({ power: value ? true : false })];
						case 1:
							_a.sent();
							return [2 /*return*/];
					}
				});
			}); 
		});
		return _this;
	}
	/**
     * Start periodic updates of device state
     */
	RabbitAirAccessory.prototype.startPeriodicUpdates = function () {
		var _this = this;
		// Update state every 30 seconds
		this.updateInterval = setInterval(() => {
			return __awaiter(_this, void 0, void 0, function () {
				var error_1;
				return __generator(this, function (_a) {
					switch (_a.label) {
						case 0:
							_a.trys.push([0, 2, , 3]);
							return [4 /*yield*/, this.updateDeviceState()];
						case 1:
							_a.sent();
							return [3 /*break*/, 3];
						case 2:
							error_1 = _a.sent();
							this.platform.log.error('Error updating device state:', error_1);
							return [3 /*break*/, 3];
						case 3: return [2 /*return*/];
					}
				});
			}); 
		}, 30000);
		// Initial state update
		this.initialUpdateTimeout = setTimeout(() => {
			return __awaiter(_this, void 0, void 0, function () {
				var error_2;
				return __generator(this, function (_a) {
					switch (_a.label) {
						case 0:
							_a.trys.push([0, 2, , 3]);
							return [4 /*yield*/, this.updateDeviceState()];
						case 1:
							_a.sent();
							return [3 /*break*/, 3];
						case 2:
							error_2 = _a.sent();
							this.platform.log.error('Error in initial state update:', error_2);
							return [3 /*break*/, 3];
						case 3: return [2 /*return*/];
					}
				});
			}); 
		}, 5000);
	};
	/**
     * Stop periodic updates and cleanup resources
     */
	RabbitAirAccessory.prototype.stopPeriodicUpdates = function () {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
		if (this.initialUpdateTimeout) {
			clearTimeout(this.initialUpdateTimeout);
			this.initialUpdateTimeout = null;
		}
	};
	/**
     * Cleanup resources
     */
	RabbitAirAccessory.prototype.cleanup = function () {
		return __awaiter(this, void 0, void 0, function () {
			var error_3;
			return __generator(this, function (_a) {
				switch (_a.label) {
					case 0:
						this.platform.log.debug('Cleaning up RabbitAir accessory');
						this.stopPeriodicUpdates();
						_a.label = 1;
					case 1:
						_a.trys.push([1, 3, , 4]);
						return [4 /*yield*/, this.client.shutdown()];
					case 2:
						_a.sent();
						return [3 /*break*/, 4];
					case 3:
						error_3 = _a.sent();
						this.platform.log.error('Error during client shutdown:', error_3);
						return [3 /*break*/, 4];
					case 4: return [2 /*return*/];
				}
			});
		});
	};
	/**
     * Update device state from RabbitAir device
     */
	RabbitAirAccessory.prototype.updateDeviceState = function () {
		return __awaiter(this, void 0, void 0, function () {
			var state, airQualityService, error_4;
			return __generator(this, function (_a) {
				switch (_a.label) {
					case 0:
						_a.trys.push([0, 2, , 3]);
						return [4 /*yield*/, this.client.getState()];
					case 1:
						state = _a.sent();
						this.services.airPurifier.active = state.power ? 1 /* Enums.Active.Active */ : 0 /* Enums.Active.Inactive */;
						// Update internal stat
						// Update current air purifier state based on power and speed
						if (!state.power) {
							this.services.airPurifier.currentAirPurifierState =
                                0 /* Enums.CurrentAirPurifierState.Inactive */;
						} else if (state.idle === rabbitair_client_js_1.RabbitAirSpeed.SuperSilent) {
							this.services.airPurifier.currentAirPurifierState = 1 /* Enums.CurrentAirPurifierState.Idle */;
						} else {
							this.services.airPurifier.currentAirPurifierState = 2 /* Enums.CurrentAirPurifierState.PurifyingAir */;
						}
						this.services.airPurifier.targetAirPurifierState =
                            state.mode === rabbitair_client_js_1.RabbitAirMode.Auto
                            	? 1 /* Enums.TargetAirPurifierState.Auto */
                            	: 0 /* Enums.TargetAirPurifierState.Manual */;
						// Update target air purifier state based on mode
						// Update rotation speed
						this.services.airPurifier.rotationSpeed = state.speed || 0;
						// Update filter status
						if (state.filterReplacement) {
							this.services.filterMaintenance.filterChangeIndication =
                                1 /* Enums.FilterChangeIndication.ChangeFilter */;
						} else {
							this.services.filterMaintenance.filterChangeIndication =
                                0 /* Enums.FilterChangeIndication.FilterOk */;
						}
						// Update filter life level (convert from minutes to percentage)
						if (state.filterLife !== undefined) {
							this.services.filterMaintenance.filterLifeLevel = Math.max(0, Math.min(100, Math.round((state.filterLife / 525600) * 100)));
						}
						// Update air quality
						if (state.quality !== undefined) {
							switch (state.quality) {
								case rabbitair_client_js_1.RabbitAirQuality.Lowest:
								case rabbitair_client_js_1.RabbitAirQuality.Low:
									this.services.airQualitySensor.airQuality =
                                        5 /* Enums.AirQuality.Poor */;
									break;
								case rabbitair_client_js_1.RabbitAirQuality.Medium:
									this.services.airQualitySensor.airQuality =
                                        3 /* Enums.AirQuality.Fair */;
									break;
								case rabbitair_client_js_1.RabbitAirQuality.High:
									this.services.airQualitySensor.airQuality =
                                        2 /* Enums.AirQuality.Good */;
									break;
								case rabbitair_client_js_1.RabbitAirQuality.Highest:
									this.services.airQualitySensor.airQuality =
                                        1 /* Enums.AirQuality.Excellent */;
									break;
								default:
									this.services.airQualitySensor.airQuality =
                                        0 /* Enums.AirQuality.Unknown */;
							}
						}
						airQualityService = this.accessory.getService(this.platform.Service.AirQualitySensor);
						if (airQualityService) {
							airQualityService.updateCharacteristic(this.platform.Characteristic.AirQuality, this.currentState.airQuality);
						}
						return [3 /*break*/, 3];
					case 2:
						error_4 = _a.sent();
						this.platform.log.error('Failed to update device state:', error_4);
						return [3 /*break*/, 3];
					case 3: return [2 /*return*/];
				}
			});
		});
	};
	// Characteristic handlers
	RabbitAirAccessory.prototype.setActive = function (value) {
		return __awaiter(this, void 0, void 0, function () {
			var active, error_5;
			return __generator(this, function (_a) {
				switch (_a.label) {
					case 0:
						active = value;
						this.platform.log.debug('Set Active ->', active);
						_a.label = 1;
					case 1:
						_a.trys.push([1, 3, , 4]);
						return [4 /*yield*/, this.client.setState({ power: active })];
					case 2:
						_a.sent();
						return [3 /*break*/, 4];
					case 3:
						error_5 = _a.sent();
						this.platform.log.error('Failed to set active state:', error_5);
						throw new this.platform.api.hap.HapStatusError(-70402 /* this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
					case 4: return [2 /*return*/];
				}
			});
		});
	};
	RabbitAirAccessory.prototype.getActive = function () {
		return __awaiter(this, void 0, void 0, function () {
			return __generator(this, function (_a) {
				this.platform.log.debug('Get Active ->', this.currentState.active);
				return [2 /*return*/, this.currentState.active];
			});
		});
	};
	RabbitAirAccessory.prototype.getCurrentAirPurifierState = function () {
		return __awaiter(this, void 0, void 0, function () {
			return __generator(this, function (_a) {
				this.platform.log.debug('Get Current Air Purifier State ->', this.currentState.currentAirPurifierState);
				return [2 /*return*/, this.currentState.currentAirPurifierState];
			});
		});
	};
	RabbitAirAccessory.prototype.setTargetAirPurifierState = function (value) {
		return __awaiter(this, void 0, void 0, function () {
			var targetState, error_6;
			return __generator(this, function (_a) {
				switch (_a.label) {
					case 0:
						targetState = value;
						this.platform.log.debug('Set Target Air Purifier State ->', targetState);
						_a.label = 1;
					case 1:
						_a.trys.push([1, 6, , 7]);
						if (!(targetState === this.platform.Characteristic.TargetAirPurifierState.AUTO)) {
							return [3 /*break*/, 3];
						}
						return [4 /*yield*/, this.client.setState({ mode: rabbitair_client_js_1.RabbitAirMode.Auto })];
					case 2:
						_a.sent();
						return [3 /*break*/, 5];
					case 3: return [4 /*yield*/, this.client.setState({ mode: rabbitair_client_js_1.RabbitAirMode.Manual })];
					case 4:
						_a.sent();
						_a.label = 5;
					case 5:
						this.currentState.targetAirPurifierState = targetState;
						return [3 /*break*/, 7];
					case 6:
						error_6 = _a.sent();
						this.platform.log.error('Failed to set target air purifier state:', error_6);
						throw new this.platform.api.hap.HapStatusError(-70402 /* this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
					case 7: return [2 /*return*/];
				}
			});
		});
	};
	RabbitAirAccessory.prototype.getTargetAirPurifierState = function () {
		return __awaiter(this, void 0, void 0, function () {
			return __generator(this, function (_a) {
				this.platform.log.debug('Get Target Air Purifier State ->', this.currentState.targetAirPurifierState);
				return [2 /*return*/, this.currentState.targetAirPurifierState];
			});
		});
	};
	RabbitAirAccessory.prototype.setRotationSpeed = function (value) {
		return __awaiter(this, void 0, void 0, function () {
			var speed, error_7;
			return __generator(this, function (_a) {
				switch (_a.label) {
					case 0:
						speed = value;
						this.platform.log.debug('Set Rotation Speed ->', speed);
						_a.label = 1;
					case 1:
						_a.trys.push([1, 3, , 4]);
						return [4 /*yield*/, this.client.setState({ speed: speed })];
					case 2:
						_a.sent();
						this.currentState.rotationSpeed = speed;
						return [3 /*break*/, 4];
					case 3:
						error_7 = _a.sent();
						this.platform.log.error('Failed to set rotation speed:', error_7);
						throw new this.platform.api.hap.HapStatusError(-70402 /* this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
					case 4: return [2 /*return*/];
				}
			});
		});
	};
	RabbitAirAccessory.prototype.getRotationSpeed = function () {
		return __awaiter(this, void 0, void 0, function () {
			return __generator(this, function (_a) {
				this.platform.log.debug('Get Rotation Speed ->', this.currentState.rotationSpeed);
				return [2 /*return*/, this.currentState.rotationSpeed];
			});
		});
	};
	RabbitAirAccessory.prototype.getFilterChangeIndication = function () {
		return __awaiter(this, void 0, void 0, function () {
			return __generator(this, function (_a) {
				this.platform.log.debug('Get Filter Change Indication ->', this.currentState.filterChangeIndication);
				return [2 /*return*/, this.currentState.filterChangeIndication];
			});
		});
	};
	RabbitAirAccessory.prototype.getFilterLifeLevel = function () {
		return __awaiter(this, void 0, void 0, function () {
			return __generator(this, function (_a) {
				this.platform.log.debug('Get Filter Life Level ->', this.currentState.filterLifeLevel);
				return [2 /*return*/, this.currentState.filterLifeLevel];
			});
		});
	};
	RabbitAirAccessory.prototype.getAirQuality = function () {
		return __awaiter(this, void 0, void 0, function () {
			return __generator(this, function (_a) {
				this.platform.log.debug('Get Air Quality ->', this.currentState.airQuality);
				return [2 /*return*/, this.currentState.airQuality];
			});
		});
	};
	return RabbitAirAccessory;
}(hap_fluent_1.AccessoryHandler));
exports.RabbitAirAccessory = RabbitAirAccessory;
