import { RabbitAirMode, RabbitAirSpeed, RabbitAirQuality, RabbitAirSensitivity } from '../../src/rabbitair-client.js';

export const mockDeviceConfig = {
	name: 'Test Air Purifier',
	host: '192.168.1.100',
	token: '12345678901234567890123456789012',
	port: 9009
};

export const mockDeviceState = {
	power: true,
	mode: RabbitAirMode.Auto,
	speed: RabbitAirSpeed.Medium,
	quality: RabbitAirQuality.Medium,
	sensitivity: RabbitAirSensitivity.Medium,
	ionizer: true,
	filterLife: 300000,
	filterCleaning: false,
	filterReplacement: false,
	error: 0,
	rssi: -45
};

export const mockDeviceStateResponse = {
	id: 1,
	cmd: 1,
	data: {
		model: 1,
		firmware: [1, 0, 0],
		power: true,
		mode: RabbitAirMode.Auto,
		speed: RabbitAirSpeed.Medium,
		quality: RabbitAirQuality.Medium,
		sensitivity: RabbitAirSensitivity.Medium,
		ionizer: true,
		idle: 0,
		moodlight: 0,
		filter_cleaning: false,
		filter_replacement: false,
		filter_life: 300000,
		light_sensor: true,
		filter_timer: 0,
		all_light_off: 0,
		error: 0,
		tag_state: 0,
		tag_uid: [0, 0, 0, 0],
		filter_type: 1,
		pm_sensor: [10, 15, 20],
		color: [255, 255, 255],
		lsens_ctl: true,
		filter_ctl: true,
		buzzer: true,
		gas: 50,
		lock: false,
		open: false,
		light_state: 1,
		timer_mode: 0,
		timer: 0,
		schedule: '',
		tz: null,
		s2: null,
		rssi: -45,
		v: '1.0.0'
	}
};

export const mockPlatformConfig = {
	platform: 'RabbitAir',
	name: 'RabbitAir',
	devices: [mockDeviceConfig]
};

export const createMockLogger = () => ({
	debug: () => {},
	info: () => {},
	warn: () => {},
	error: () => {},
	log: () => {}
});

export const createMockService = () => ({
	setCharacteristic: function() { return this; },
	getCharacteristic: function() { return this; },
	onSet: function() { return this; },
	onGet: function() { return this; },
	setProps: function() { return this; },
	updateCharacteristic: function() { return this; }
});

export const createMockAccessory = () => ({
	UUID: 'test-uuid-1234',
	displayName: 'Test Air Purifier',
	context: {
		device: mockDeviceConfig
	},
	getService: () => createMockService(),
	addService: () => createMockService()
});