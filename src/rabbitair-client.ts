import CryptoJS from 'crypto-js';
import { createSocket, Socket } from 'dgram';
import { Logger } from 'homebridge';

export enum RabbitAirMode {
	Auto = 0,
	Pollen = 1,
	Manual = 2
}

export enum RabbitAirSpeed {
	SuperSilent = 0,
	Silent = 1,
	Low = 2,
	Medium = 3,
	High = 4,
	Turbo = 5
}

export enum RabbitAirQuality {
	Lowest = 0,
	Low = 1,
	Medium = 2,
	High = 3,
	Highest = 4
}

export enum RabbitAirSensitivity {
	High = 0,
	Medium = 1,
	Low = 2
}

export interface RabbitAirState {
	power?: boolean;
	mode?: RabbitAirMode;
	speed?: RabbitAirSpeed;
	quality?: RabbitAirQuality;
	sensitivity?: RabbitAirSensitivity;
	ionizer?: boolean;
	filterLife?: number;
	filterCleaning?: boolean;
	filterReplacement?: boolean;
	error?: number;
	rssi?: number;
}

export interface RabbitAirInfo {
	name: string;
	mac: string;
	model?: string;
	firmware?: string;
	uptime?: number;
}

export interface RabbitAirConfig {
	host: string;
	token: string;
	port?: number;
}

export interface RabbitAirStateResponse {
	id: number;
	cmd: number;
	data: {
		power: boolean;
		mode: RabbitAirMode;
		speed: RabbitAirSpeed;
		quality: RabbitAirQuality;
		sensitivity: RabbitAirSensitivity;
		ionizer: boolean;
		filter_life: number;
		filter_cleaning: boolean;
		filter_replacement: boolean;
		error: number;
		rssi: number;
	};
	error?: number;
}

export interface RabbitAirInfoResponse {
	id: number;
	cmd: number;
	data: {
		name: string;
		mac: string;
		model?: string;
		fv?: string;
		uptime?: number;
	};
	error?: number;
}

export class RabbitAirClient {
	private socket: Socket | null = null;
	private host: string;
	private port: number;
	private token: Buffer;
	private commandId = Math.floor(Math.random() * 0x1000000);
	private tsDiff: number | null = null;
	private isConnected = false;
	private logger: Logger;
	private readonly TIMEOUT_MS = 10000; // Increased timeout to 10 seconds
	private readonly MAX_RETRIES = 3;
	private connectionAttempts = 0;
	private readonly MAX_CONNECTION_ATTEMPTS = 5;

	constructor(config: RabbitAirConfig, logger: Logger) {
		this.logger = logger;
		this.host = config.host;
		this.port = config.port || 9009;

		this.logger.debug(
			`Initializing RabbitAirClient for host: ${this.host}:${this.port}`
		);

		if (!config.token || config.token.length !== 32) {
			this.logger.error(
				'Invalid token length. Token must be 32 characters (16 bytes hex)'
			);
			throw new Error('Invalid token length');
		}

		this.token = Buffer.from(config.token, 'hex');
		this.logger.debug(
			`Token loaded successfully (length: ${this.token.length} bytes)`
		);
		this.logger.debug(`Initial command ID: ${this.commandId}`);
	}

	private nextId(): number {
		const newId = ++this.commandId;
		this.logger.debug(`Generated new command ID: ${newId}`);
		return newId;
	}

	private getClock(): number {
		const timestamp = Date.now() / 1000;
		this.logger.debug(`Current clock time: ${timestamp}`);
		return timestamp;
	}

	private getTimestamp(): number {
		if (this.tsDiff === null) {
			this.logger.error('Attempting to get timestamp before synchronization');
			throw new Error('Timestamp not synchronized');
		}
		const timestamp = Math.round(this.getClock() + this.tsDiff);
		this.logger.debug(
			`Generated timestamp: ${timestamp} (tsDiff: ${this.tsDiff})`
		);
		return timestamp;
	}

	private encrypt(data: Buffer): Buffer {
		this.logger.debug(`Encrypting data (length: ${data.length} bytes)`);

		// Convert to CryptoJS format
		const key = CryptoJS.enc.Hex.parse(this.token.toString('hex'));
		const iv = CryptoJS.lib.WordArray.random(16);
		const message = CryptoJS.enc.Utf8.parse(data.toString());

		const encrypted = CryptoJS.AES.encrypt(message, key, {
			iv: iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7
		});

		// Combine encrypted data with IV
		const combined = encrypted.ciphertext.concat(iv);
		const result = Buffer.from(
			combined.toString(CryptoJS.enc.Base64),
			'base64'
		);

		this.logger.debug(`Encrypted data (length: ${result.length} bytes)`);
		return result;
	}
	private decrypt(data: Buffer): Buffer {
		this.logger.debug(`Decrypting data (length: ${data.length} bytes)`);

		try {
			// Extract IV from the end of the message
			const iv = data.slice(-16);
			const encrypted = data.slice(0, -16);

			// Convert to CryptoJS format
			const key = CryptoJS.enc.Hex.parse(this.token.toString('hex'));
			const ivWords = CryptoJS.enc.Hex.parse(iv.toString('hex'));
			const encryptedWords = CryptoJS.enc.Hex.parse(encrypted.toString('hex'));

			const decrypted = CryptoJS.AES.decrypt(
				{ ciphertext: encryptedWords } as CryptoJS.lib.CipherParams,
				key,
				{ iv: ivWords, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
			);

			const result = Buffer.from(decrypted.toString(CryptoJS.enc.Utf8), 'utf8');
			this.logger.debug(
				`Decrypted data (length: ${result.length} bytes): ${result.toString()}`
			);
			return result;
		} catch (error) {
			this.logger.error(`Decryption failed: ${error}`);
			throw new Error(`Decryption failed: ${error}`);
		}
	}

	private async sendCommand(
		command: Record<string, unknown>
	): Promise<Record<string, unknown>> {
		this.logger.debug(`Sending command: ${JSON.stringify(command)}`);

		return new Promise((resolve, reject) => {
			if (!this.socket) {
				this.logger.error('Cannot send command: Socket not connected');
				return reject(new Error('Socket not connected'));
			}

			const requestId = this.nextId();
			command.id = requestId;
			this.logger.debug(`Command assigned ID: ${requestId}`);

			if (this.token) {
				this.logger.debug('Using encrypted communication');
				if (this.tsDiff === null) {
					this.logger.debug('Timestamp not synchronized, initiating sync');
					// First, synchronize timestamp
					const tsRequest = { id: this.nextId(), cmd: 9 };
					this.logger.debug(
						`Sending timestamp sync request: ${JSON.stringify(tsRequest)}`
					);
					const tsData = JSON.stringify(tsRequest);
					const encryptedTsData = this.encrypt(Buffer.from(tsData));

					this.socket.send(encryptedTsData, this.port, this.host, (err) => {
						if (err) {
							this.logger.error(
								`Failed to send timestamp sync request: ${err.message}`
							);
							reject(err);
						} else {
							this.logger.debug('Timestamp sync request sent successfully');
						}
					});

					// Wait for timestamp response
					const onTsMessage = (msg: Buffer) => {
						this.logger.debug(
							`Received timestamp sync response (${msg.length} bytes)`
						);
						try {
							const decrypted = this.decrypt(msg);
							const response = JSON.parse(decrypted.toString());
							this.logger.debug(
								`Timestamp sync response: ${JSON.stringify(response)}`
							);

							if (response.id === tsRequest.id) {
								this.tsDiff = response.data.ts - this.getClock();
								this.logger.debug(
									`Timestamp synchronized. Diff: ${this.tsDiff}`
								);
								this.socket!.removeListener('message', onTsMessage);

								// Now send the actual command
								command.ts = this.getTimestamp();
								this.logger.debug(
									`Sending actual command with timestamp: ${JSON.stringify(command)}`
								);
								const commandData = JSON.stringify(command);
								const encryptedCommandData = this.encrypt(
									Buffer.from(commandData)
								);

								this.socket!.send(
									encryptedCommandData,
									this.port,
									this.host,
									(err) => {
										if (err) {
											this.logger.error(
												`Failed to send command: ${err.message}`
											);
											reject(err);
										} else {
											this.logger.debug('Command sent successfully');
										}
									}
								);

								// Wait for command response
								const onCommandMessage = (msg: Buffer) => {
									this.logger.debug(
										`Received command response (${msg.length} bytes)`
									);
									try {
										const decrypted = this.decrypt(msg);
										const response = JSON.parse(decrypted.toString());
										this.logger.debug(
											`Command response: ${JSON.stringify(response)}`
										);

										if (response.id === requestId) {
											this.socket!.removeListener('message', onCommandMessage);
											if (response.error) {
												this.logger.error(
													`Command failed with protocol error: ${JSON.stringify(response.error)}`
												);
												reject(new Error('Protocol error'));
											} else {
												this.logger.debug('Command completed successfully');
												resolve(response);
											}
										}
									} catch (error) {
										this.logger.debug(
											`Ignoring parsing error for unexpected message: ${error}`
										);
										// Ignore parsing errors for unexpected messages
									}
								};

								this.socket!.on('message', onCommandMessage);

								// Set timeout
								setTimeout(() => {
									this.socket!.removeListener('message', onCommandMessage);
									this.logger.error(
										`Command timeout after ${this.TIMEOUT_MS}ms`
									);
									reject(new Error('Command timeout'));
								}, this.TIMEOUT_MS);
							}
						} catch (error) {
							this.logger.debug(
								`Ignoring parsing error for unexpected timestamp message: ${error}`
							);
							// Ignore parsing errors for unexpected messages
						}
					};

					this.socket.on('message', onTsMessage);

					// Set timeout for timestamp sync
					setTimeout(() => {
						this.socket!.removeListener('message', onTsMessage);
						this.logger.error(
							`Timestamp sync timeout after ${this.TIMEOUT_MS}ms`
						);
						reject(new Error('Timestamp sync timeout'));
					}, this.TIMEOUT_MS);
				} else {
					this.logger.debug(
						'Timestamp already synchronized, sending command directly'
					);
					// Timestamp already synchronized
					command.ts = this.getTimestamp();
					this.logger.debug(
						`Sending command with timestamp: ${JSON.stringify(command)}`
					);
					const commandData = JSON.stringify(command);
					const encryptedCommandData = this.encrypt(Buffer.from(commandData));

					this.socket.send(
						encryptedCommandData,
						this.port,
						this.host,
						(err) => {
							if (err) {
								this.logger.error(`Failed to send command: ${err.message}`);
								reject(err);
							} else {
								this.logger.debug('Command sent successfully');
							}
						}
					);

					// Wait for command response
					const onMessage = (msg: Buffer) => {
						this.logger.debug(
							`Received command response (${msg.length} bytes)`
						);
						try {
							const decrypted = this.decrypt(msg);
							const response = JSON.parse(decrypted.toString());
							this.logger.debug(
								`Command response: ${JSON.stringify(response)}`
							);

							if (response.id === requestId) {
								this.socket!.removeListener('message', onMessage);
								if (response.error) {
									this.logger.error(
										`Command failed with protocol error: ${JSON.stringify(response.error)}`
									);
									reject(new Error('Protocol error'));
								} else {
									this.logger.debug('Command completed successfully');
									resolve(response);
								}
							}
						} catch (error) {
							this.logger.debug(
								`Ignoring parsing error for unexpected message: ${error}`
							);
							// Ignore parsing errors for unexpected messages
						}
					};

					this.socket.on('message', onMessage);

					// Set timeout
					setTimeout(() => {
						if (this.socket) {
							this.socket.removeListener('message', onMessage);
						}
						this.logger.error(`Command timeout after ${this.TIMEOUT_MS}ms`);
						reject(new Error('Command timeout'));
					}, this.TIMEOUT_MS);
				}
			} else {
				this.logger.debug('Using unencrypted communication');
				// No encryption
				const commandData = JSON.stringify(command);
				this.logger.debug(`Sending unencrypted command: ${commandData}`);
				this.socket.send(commandData, this.port, this.host, (err) => {
					if (err) {
						this.logger.error(
							`Failed to send unencrypted command: ${err.message}`
						);
						reject(err);
					} else {
						this.logger.debug('Unencrypted command sent successfully');
					}
				});

				// Wait for response
				const onMessage = (msg: Buffer) => {
					this.logger.debug(
						`Received unencrypted response (${msg.length} bytes): ${msg.toString()}`
					);
					try {
						const response = JSON.parse(msg.toString());
						this.logger.debug(
							`Unencrypted response: ${JSON.stringify(response)}`
						);

						if (response.id === requestId) {
							this.socket!.removeListener('message', onMessage);
							if (response.error) {
								this.logger.error(
									`Unencrypted command failed with protocol error: ${JSON.stringify(response.error)}`
								);
								reject(new Error('Protocol error'));
							} else {
								this.logger.debug('Unencrypted command completed successfully');
								resolve(response);
							}
						}
					} catch (error) {
						this.logger.debug(
							`Ignoring parsing error for unexpected unencrypted message: ${error}`
						);
						// Ignore parsing errors for unexpected messages
					}
				};

				this.socket.on('message', onMessage);

				// Set timeout
				setTimeout(() => {
					if (this.socket) {
						this.socket.removeListener('message', onMessage);
					}
					this.logger.error(
						`Unencrypted command timeout after ${this.TIMEOUT_MS}ms`
					);
					reject(new Error('Command timeout'));
				}, this.TIMEOUT_MS);
			}
		});
	}

	private async fallbackUnencryptedCommand(
		command: Record<string, unknown>
	): Promise<Record<string, unknown>> {
		this.logger.warn('Attempting fallback to unencrypted communication');

		return new Promise((resolve, reject) => {
			if (!this.socket) {
				this.logger.error('Cannot send fallback command: Socket not connected');
				return reject(new Error('Socket not connected'));
			}

			const requestId = this.nextId();
			command.id = requestId;

			const commandData = JSON.stringify(command);
			this.logger.debug(`Sending fallback unencrypted command: ${commandData}`);

			this.socket.send(commandData, this.port, this.host, (err) => {
				if (err) {
					this.logger.error(`Failed to send fallback command: ${err.message}`);
					reject(err);
				} else {
					this.logger.debug('Fallback command sent successfully');
				}
			});

			// Wait for response
			const onMessage = (msg: Buffer) => {
				this.logger.debug(
					`Received fallback response (${msg.length} bytes): ${msg.toString()}`
				);
				try {
					const response = JSON.parse(msg.toString());
					this.logger.debug(`Fallback response: ${JSON.stringify(response)}`);

					if (response.id === requestId) {
						this.socket!.removeListener('message', onMessage);
						if (response.error) {
							this.logger.error(
								`Fallback command failed: ${JSON.stringify(response.error)}`
							);
							reject(new Error('Protocol error'));
						} else {
							this.logger.debug('Fallback command completed successfully');
							resolve(response);
						}
					}
				} catch (error) {
					this.logger.debug(
						`Ignoring parsing error for unexpected fallback message: ${error}`
					);
				}
			};

			this.socket.on('message', onMessage);

			// Set timeout
			setTimeout(() => {
				if (this.socket) {
					this.socket.removeListener('message', onMessage);
				}
				this.logger.error(
					`Fallback command timeout after ${this.TIMEOUT_MS}ms`
				);
				reject(new Error('Fallback command timeout'));
			}, this.TIMEOUT_MS);
		});
	}

	private async testConnection(): Promise<boolean> {
		this.logger.debug('Testing connection to device');

		if (!this.socket || !this.isConnected) {
			this.logger.debug('Socket not connected, attempting to connect');
			try {
				await this.connect();
			} catch (error) {
				this.logger.error(`Failed to connect during connection test: ${error}`);
				return false;
			}
		}

		try {
			// Try a simple ping command
			const testCommand = { cmd: 255 }; // Info command
			const result = await this.sendCommandWithRetry(testCommand, 1);
			this.logger.debug('Connection test successful');
			return !!result;
		} catch (error) {
			this.logger.error(`Connection test failed: ${error}`);

			// Reset connection state on failure
			this.isConnected = false;
			this.tsDiff = null;

			return false;
		}
	}

	private async sendCommandWithRetry(
		command: Record<string, unknown>,
		retries = this.MAX_RETRIES
	): Promise<Record<string, unknown>> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				this.logger.debug(`Sending command attempt ${attempt}/${retries}`);
				return await this.sendCommand(command);
			} catch (error) {
				lastError = error as Error;
				this.logger.warn(
					`Command attempt ${attempt}/${retries} failed: ${lastError.message}`
				);

				if (attempt < retries) {
					// Reset timestamp diff on retry to force re-sync
					if (lastError.message.includes('Timestamp sync timeout')) {
						this.logger.debug('Resetting timestamp diff due to sync timeout');
						this.tsDiff = null;
					}

					// Wait before retry with exponential backoff
					const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
					this.logger.debug(`Waiting ${delay}ms before retry`);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		// If all encrypted attempts failed, try fallback unencrypted communication
		if (
			this.token &&
			lastError &&
			lastError.message.includes('Timestamp sync timeout')
		) {
			this.logger.warn(
				'All encrypted attempts failed, trying fallback unencrypted communication'
			);
			try {
				return await this.fallbackUnencryptedCommand(command);
			} catch (fallbackError) {
				this.logger.error(
					`Fallback communication also failed: ${fallbackError}`
				);
				throw lastError; // Throw the original error
			}
		}

		throw lastError;
	}

	async connect(): Promise<void> {
		this.logger.debug(
			`Attempting to connect to ${this.host}:${this.port} (attempt ${this.connectionAttempts + 1}/${this.MAX_CONNECTION_ATTEMPTS})`
		);

		if (this.isConnected) {
			this.logger.debug('Already connected, skipping connection');
			return;
		}

		if (this.connectionAttempts >= this.MAX_CONNECTION_ATTEMPTS) {
			const error = new Error(
				`Max connection attempts (${this.MAX_CONNECTION_ATTEMPTS}) exceeded`
			);
			this.logger.error(error.message);
			throw error;
		}

		this.connectionAttempts++;

		// Clean up any existing socket
		if (this.socket) {
			this.logger.debug('Cleaning up existing socket');
			this.socket.removeAllListeners();
			this.socket.close();
			this.socket = null;
			this.isConnected = false;
		}

		return new Promise((resolve, reject) => {
			this.socket = createSocket('udp4');
			this.logger.debug('Created UDP socket');

			// Set up error handling
			this.socket.on('error', (err) => {
				this.logger.error(`Socket error: ${err.message}`);
				this.isConnected = false;
				reject(err);
			});

			this.socket.on('listening', () => {
				try {
					const address = this.socket!.address();
					this.logger.debug(
						`Socket listening on ${address.address}:${address.port}`
					);
					this.isConnected = true;
					this.connectionAttempts = 0; // Reset on successful connection
					this.logger.info(
						`Successfully connected to RabbitAir device at ${this.host}:${this.port}`
					);
					resolve();
				} catch (error) {
					this.logger.error(`Error getting socket address: ${error}`);
					this.isConnected = false;
					reject(error);
				}
			});

			// Set a timeout for binding
			const bindTimeout = setTimeout(() => {
				this.logger.error('Socket bind timeout');
				if (this.socket) {
					this.socket.close();
					this.socket = null;
				}
				this.isConnected = false;
				reject(new Error('Socket bind timeout'));
			}, 5000);

			try {
				this.socket.bind(() => {
					clearTimeout(bindTimeout);
				});
			} catch (error) {
				clearTimeout(bindTimeout);
				this.logger.error(`Failed to bind socket: ${error}`);
				reject(error);
			}
		});
	}

	async disconnect(): Promise<void> {
		this.logger.debug('Attempting to disconnect');

		if (this.socket) {
			return new Promise((resolve) => {
				this.socket!.close(() => {
					this.logger.debug('Socket closed successfully');
					this.socket = null;
					this.isConnected = false;
					this.tsDiff = null;
					this.logger.info('Disconnected from RabbitAir device');
					resolve();
				});
			});
		} else {
			this.logger.debug('No socket to disconnect');
		}
	}

	async getState(): Promise<RabbitAirState> {
		this.logger.debug('Requesting device state');

		try {
			// Test connection first
			const isConnected = await this.testConnection();
			if (!isConnected) {
				throw new Error('Device not reachable');
			}

			const response = await this.sendCommandWithRetry({ cmd: 4 });
			const data = response.data as Record<string, unknown>;

			if (!data) {
				this.logger.error('Invalid response data: no data field found');
				throw new Error('Invalid response data');
			}

			const state: RabbitAirState = {
				power: data.power as boolean,
				mode: data.mode as RabbitAirMode,
				speed: data.speed as RabbitAirSpeed,
				quality: data.quality as RabbitAirQuality,
				sensitivity: data.sensitivity as RabbitAirSensitivity,
				ionizer: data.ionizer as boolean,
				filterLife: data.filter_life as number,
				filterCleaning: data.filter_cleaning as boolean,
				filterReplacement: data.filter_replacement as boolean,
				error: data.error as number,
				rssi: data.rssi as number
			};

			this.logger.debug(`Device state retrieved: ${JSON.stringify(state)}`);
			return state;
		} catch (error) {
			this.logger.error(`Failed to get device state: ${error}`);
			// Don't disconnect on error - let it retry
			throw error;
		}
	}

	async setState(state: Partial<RabbitAirState>): Promise<void> {
		this.logger.debug(`Setting device state: ${JSON.stringify(state)}`);

		try {
			// Test connection first
			const isConnected = await this.testConnection();
			if (!isConnected) {
				throw new Error('Device not reachable');
			}

			const data: Record<string, unknown> = {};

			if (state.power !== undefined) {
				data.power = state.power;
				this.logger.debug(`Setting power: ${state.power}`);
			}
			if (state.mode !== undefined) {
				data.mode = state.mode;
				this.logger.debug(
					`Setting mode: ${state.mode} (${RabbitAirMode[state.mode]})`
				);
			}
			if (state.speed !== undefined) {
				data.speed = state.speed;
				this.logger.debug(
					`Setting speed: ${state.speed} (${RabbitAirSpeed[state.speed]})`
				);
			}
			if (state.sensitivity !== undefined) {
				data.sensitivity = state.sensitivity;
				this.logger.debug(
					`Setting sensitivity: ${state.sensitivity} (${RabbitAirSensitivity[state.sensitivity]})`
				);
			}
			if (state.ionizer !== undefined) {
				data.ionizer = state.ionizer;
				this.logger.debug(`Setting ionizer: ${state.ionizer}`);
			}

			this.logger.debug(`Command data to send: ${JSON.stringify(data)}`);
			await this.sendCommandWithRetry({ cmd: 4, data: data });
			this.logger.debug('Device state updated successfully');
		} catch (error) {
			this.logger.error(`Failed to set device state: ${error}`);
			// Don't disconnect on error - let it retry
			throw error;
		}
	}

	async getInfo(): Promise<RabbitAirInfo> {
		this.logger.debug('Requesting device info');

		try {
			// Test connection first
			const isConnected = await this.testConnection();
			if (!isConnected) {
				throw new Error('Device not reachable');
			}

			const response = await this.sendCommandWithRetry({ cmd: 255 });
			const data = response.data as Record<string, unknown>;

			const info: RabbitAirInfo = {
				name: data.name as string,
				mac: data.mac as string,
				model: data.model as string,
				firmware: data.fv as string,
				uptime: data.uptime as number
			};

			this.logger.debug(`Device info retrieved: ${JSON.stringify(info)}`);
			return info;
		} catch (error) {
			this.logger.error(`Failed to get device info: ${error}`);
			// Don't disconnect on error - let it retry
			throw error;
		}
	}

	async checkDeviceCapabilities(): Promise<{
		supportsEncryption: boolean;
		responsive: boolean;
	}> {
		this.logger.debug('Checking device capabilities');

		let supportsEncryption = false;
		let responsive = false;

		try {
			// First try unencrypted communication
			this.logger.debug('Testing unencrypted communication');
			const unencryptedResult = await this.fallbackUnencryptedCommand({
				cmd: 255
			});
			if (unencryptedResult) {
				responsive = true;
				this.logger.debug('Device responds to unencrypted commands');
			}
		} catch (error) {
			this.logger.debug(`Unencrypted communication failed: ${error}`);
		}

		if (this.token) {
			try {
				// Try encrypted communication
				this.logger.debug('Testing encrypted communication');
				const encryptedResult = await this.sendCommand({ cmd: 255 });
				if (encryptedResult) {
					supportsEncryption = true;
					responsive = true;
					this.logger.debug('Device supports encrypted communication');
				}
			} catch (error) {
				this.logger.debug(`Encrypted communication failed: ${error}`);
			}
		}

		this.logger.info(
			`Device capabilities: responsive=${responsive}, supportsEncryption=${supportsEncryption}`
		);
		return { supportsEncryption, responsive };
	}

	async maintainConnection(): Promise<void> {
		this.logger.debug('Maintaining connection to device');

		try {
			if (!this.socket || !this.isConnected) {
				this.logger.debug('Connection lost, attempting to reconnect');
				await this.connect();
			}

			// Send a keep-alive ping
			const response = await this.sendCommandWithRetry({ cmd: 255 }, 1);
			if (response) {
				this.logger.debug('Keep-alive successful');
			}
		} catch (error) {
			this.logger.warn(`Keep-alive failed: ${error}`);
			// Reset connection state
			this.isConnected = false;
			this.tsDiff = null;
		}
	}

	// Add graceful shutdown method
	async shutdown(): Promise<void> {
		this.logger.debug('Shutting down RabbitAir client');

		try {
			if (this.socket) {
				this.socket.removeAllListeners();
				await this.disconnect();
			}
		} catch (error) {
			this.logger.error(`Error during shutdown: ${error}`);
		}
	}
}
