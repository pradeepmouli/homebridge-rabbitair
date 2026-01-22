const isVitest = typeof (globalThis as { vi?: unknown }).vi !== 'undefined' || process.env.VITEST === 'true';

// Vitest is now the only test runner; hap-fluent mock is always set up
if (isVitest) {
	const vi = (globalThis as { vi?: any }).vi;

	vi.mock('hap-fluent', () => {
		const enums = {
			Active: { Active: 1, Inactive: 0 },
			CurrentAirPurifierState: { Inactive: 0, Idle: 1, PurifyingAir: 2 },
			TargetAirPurifierState: { Auto: 0, Manual: 1 },
			FilterChangeIndication: { FilterOk: 0, ChangeFilter: 1 },
			AirQuality: { Unknown: 0, Poor: 1, Fair: 2, Good: 3, Excellent: 4 }
		} as const;

		const makeCharacteristic = () => {
			const characteristic: any = {
				props: { minValue: 0, maxValue: 100 },
				setProps: (props?: Record<string, unknown>) => {
					characteristic.props = { ...characteristic.props, ...(props ?? {}) };
					return characteristic;
				},
				onSet: (_handler: (value: unknown) => unknown | Promise<unknown>) => characteristic
			};
			return characteristic;
		};

		class FakeAccessoryHandler<TConfig = unknown, TServices = Record<string, unknown>> {
			public services: Record<string, any> = {};
			public platform: any;
			public accessory: any;

			constructor(platform: any, accessory: any) {
				this.platform = platform;
				this.accessory = accessory;
			}

			initialize(initial?: any): TServices {
				const { Service, Characteristic } = this.platform;

				const nameMap = new Map<any, string>();
				nameMap.set(Service.AccessoryInformation, 'AccessoryInformation');
				nameMap.set(Service.AirPurifier, 'AirPurifier');
				nameMap.set(Service.AirQualitySensor, 'AirQualitySensor');
				nameMap.set(Service.FilterMaintenance, 'FilterMaintenance');

				const ensureService = (serviceType: any) => {
					if (!this.accessory.context) {
						this.accessory.context = {};
					}

					const serviceName = nameMap.get(serviceType) ?? serviceType.name ?? serviceType?.constructor?.name ?? 'Service';
					const lookupToken = { ...serviceType, name: serviceName };

					let service = this.accessory.getService?.(lookupToken) ?? this.accessory.getService?.(serviceType);
					if (service) {
						return service;
					}

					if (this.accessory.addService) {
						service = this.accessory.addService(serviceType, serviceName);
						return service;
					}

					const characteristicStore = new Map<string, any>();
					service = {
						UUID: serviceType.UUID,
						name: serviceType.name,
						characteristics: characteristicStore,
						getCharacteristic: (charType: any) => {
							if (!characteristicStore.has(charType.UUID)) {
								characteristicStore.set(charType.UUID, makeCharacteristic());
							}
							return characteristicStore.get(charType.UUID);
						}
					};

					if (!this.accessory.services) {
						this.accessory.services = [];
					}
					this.accessory.services.push(service);

					if (!this.accessory.getService) {
						this.accessory.getService = (type: any) => {
							return this.accessory.services.find((svc: any) => svc.UUID === type.UUID);
						};
					}

					return service;
				};

				const accessoryInformation = ensureService(Service.AccessoryInformation);
				const airPurifier = ensureService(Service.AirPurifier);
				const airQualitySensor = ensureService(Service.AirQualitySensor);
				const filterMaintenance = ensureService(Service.FilterMaintenance);

				const serviceCharacteristics = {
					accessoryInformation: {
						...initial?.accessoryInformation,
						characteristics: {}
					},
					airPurifier: {
						...initial?.airPurifier,
						characteristics: {
							Active: airPurifier.getCharacteristic(Characteristic.Active),
							CurrentAirPurifierState: airPurifier.getCharacteristic(Characteristic.CurrentAirPurifierState),
							TargetAirPurifierState: airPurifier.getCharacteristic(Characteristic.TargetAirPurifierState),
							RotationSpeed: airPurifier.getCharacteristic(Characteristic.RotationSpeed)
						}
					},
					airQualitySensor: {
						...initial?.airQualitySensor,
						characteristics: {
							AirQuality: airQualitySensor.getCharacteristic(Characteristic.AirQuality)
						}
					},
					filterMaintenance: {
						...initial?.filterMaintenance,
						characteristics: {
							FilterChangeIndication: filterMaintenance.getCharacteristic(Characteristic.FilterChangeIndication),
							FilterLifeLevel: filterMaintenance.getCharacteristic(Characteristic.FilterLifeLevel)
						}
					}
				};

				this.services = serviceCharacteristics;
				return this.services as TServices;
			}

			cleanup() {
				return Promise.resolve();
			}
		}

		return { AccessoryHandler: FakeAccessoryHandler, Enums: enums };
	});
}