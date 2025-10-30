import dgram from 'dgram';
import crypto from 'crypto-js';
import { EventEmitter } from 'events';
import type { Logging } from 'homebridge';

/**
 * Mock RabbitAir UDP Server for E2E Testing
 * Simulates a RabbitAir device responding to UDP commands
 */
export class MockRabbitAirServer extends EventEmitter {
	private server: dgram.Socket | null = null;
	private port: number;
	private token: string;
	private isListening: boolean = false;
	private state: {
		power: boolean;
		mode: number;
		speed: number;
		quality: number;
		sensitivity: number;
		ionizer: boolean;
		filterLife: number;
		filterCleaning: boolean;
		filterReplacement: boolean;
		error: number;
		rssi: number;
	};
	private log: Logging;

	constructor(port: number, token: string, log: Logging) {
		super();
		this.port = port;
		this.token = token;
		this.log = log;
		this.state = {
			power: false,
			mode: 0,
			speed: 2,
			quality: 2,
			sensitivity: 1,
			ionizer: false,
			filterLife: 300000,
			filterCleaning: false,
			filterReplacement: false,
			error: 0,
			rssi: -45
		};
	}

	/**
	 * Start the mock server
	 */
	async start(): Promise<void> {
		if (this.isListening) {
			this.log.warn('Mock server is already running');
			return;
		}

		return new Promise((resolve, reject) => {
			try {
				this.server = dgram.createSocket('udp4');

				this.server.on('error', (err) => {
					this.log.error('Mock server error:', err);
					this.isListening = false;
					reject(err);
				});

				this.server.on('message', (msg, rinfo) => {
					this.handleMessage(msg, rinfo);
				});

				this.server.on('listening', () => {
					const address = this.server!.address();
					this.log.info(`Mock RabbitAir server listening on ${address.address}:${address.port}`);
					this.isListening = true;
					this.emit('listening');
					resolve();
				});

				this.server.bind(this.port, '127.0.0.1');
			} catch (err) {
				this.isListening = false;
				reject(err);
			}
		});
	}

	/**
	 * Stop the mock server
	 */
	async stop(): Promise<void> {
		if (!this.isListening || !this.server) {
			this.isListening = false;
			this.server = null;
			return;
		}

		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				this.log.warn('Server close timeout, forcing cleanup');
				this.server = null;
				this.isListening = false;
				resolve();
			}, 1000);

			this.server!.close(() => {
				clearTimeout(timeout);
				this.log.info('Mock RabbitAir server stopped');
				this.emit('stopped');
				this.server = null;
				this.isListening = false;
				// Add a small delay to ensure port is released
				setTimeout(resolve, 50);
			});
			
			// Help with cleanup
			this.server!.unref();
		});
	}

	/**
	 * Handle incoming UDP messages
	 */
	private handleMessage(msg: Buffer, rinfo: dgram.RemoteInfo): void {
		try {
			// Decrypt and parse the message
			const decrypted = this.decrypt(msg);
			const request = JSON.parse(decrypted);

			this.log.debug(`Mock server received: ${JSON.stringify(request)}`);

			// Handle different command types
			let response;
			switch (request.cmd) {
				case 4: // Get state
					response = this.createStateResponse(request.id);
					break;
				case 5: // Set state
					this.updateState(request.data);
					response = this.createAckResponse(request.id);
					break;
				case 9: // Timestamp sync
					response = this.createTimestampResponse(request.id);
					break;
				case 255: // Test/Info command
					response = this.createInfoResponse(request.id);
					break;
				default:
					this.log.warn(`Unknown command: ${request.cmd}`);
					response = this.createErrorResponse(request.id);
			}

			// Send response
			this.sendResponse(response, rinfo);
		} catch (err) {
			this.log.error('Error handling message:', err);
		}
	}

	/**
	 * Create state response
	 */
	private createStateResponse(id: number): any {
		return {
			id,
			cmd: 4,
			data: {
				model: 1,
				firmware: [1, 0, 0],
				power: this.state.power,
				mode: this.state.mode,
				speed: this.state.speed,
				quality: this.state.quality,
				sensitivity: this.state.sensitivity,
				ionizer: this.state.ionizer,
				idle: 0,
				moodlight: 0,
				filter_cleaning: this.state.filterCleaning,
				filter_replacement: this.state.filterReplacement,
				filter_life: this.state.filterLife,
				light_sensor: true,
				filter_timer: 0,
				all_light_off: 0,
				error: this.state.error,
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
				rssi: this.state.rssi,
				v: '1.0.0'
			}
		};
	}

	/**
	 * Create info response for connection test
	 */
	private createInfoResponse(id: number): any {
		return {
			id,
			cmd: 255,
			data: {
				model: 1,
				firmware: [1, 0, 0],
				v: '1.0.0',
				status: 'ok'
			}
		};
	}

	/**
	 * Create timestamp response for sync
	 */
	private createTimestampResponse(id: number): any {
		return {
			id,
			cmd: 9,
			data: {
				ts: Math.floor(Date.now() / 1000)
			}
		};
	}

	/**
	 * Create acknowledgment response
	 */
	private createAckResponse(id: number): any {
		return {
			id,
			cmd: 5,
			data: { status: 'ok' }
		};
	}

	/**
	 * Create error response
	 */
	private createErrorResponse(id: number): any {
		return {
			id,
			cmd: 1,
			data: { error: 'Unknown command' }
		};
	}

	/**
	 * Update server state from request data
	 */
	private updateState(data: any): void {
		if (data.power !== undefined) {
			this.state.power = data.power;
		}
		if (data.mode !== undefined) {
			this.state.mode = data.mode;
		}
		if (data.speed !== undefined) {
			this.state.speed = data.speed;
		}
		if (data.ionizer !== undefined) {
			this.state.ionizer = data.ionizer;
		}
		this.log.debug(`Mock server state updated: ${JSON.stringify(this.state)}`);
		this.emit('stateChanged', this.state);
	}

	/**
	 * Send response to client
	 */
	private sendResponse(response: any, rinfo: dgram.RemoteInfo): void {
		const encrypted = this.encrypt(JSON.stringify(response));
		this.server!.send(encrypted, rinfo.port, rinfo.address, (err) => {
			if (err) {
				this.log.error('Error sending response:', err);
			} else {
				this.log.debug(`Mock server sent response to ${rinfo.address}:${rinfo.port}`);
			}
		});
	}

	/**
	 * Decrypt incoming message
	 */
	private decrypt(buffer: Buffer): string {
		const key = crypto.enc.Utf8.parse(this.token);
		const iv = crypto.lib.WordArray.create(buffer.slice(0, 16).buffer as any);
		const encrypted = crypto.lib.WordArray.create(buffer.slice(16).buffer as any);

		const decrypted = crypto.AES.decrypt(
			{ ciphertext: encrypted } as any,
			key,
			{
				iv,
				mode: crypto.mode.CBC,
				padding: crypto.pad.Pkcs7
			}
		);

		return decrypted.toString(crypto.enc.Utf8);
	}

	/**
	 * Encrypt outgoing message
	 */
	private encrypt(message: string): Buffer {
		const key = crypto.enc.Utf8.parse(this.token);
		const iv = crypto.lib.WordArray.random(16);

		const encrypted = crypto.AES.encrypt(message, key, {
			iv,
			mode: crypto.mode.CBC,
			padding: crypto.pad.Pkcs7
		});

		const ivBytes = Buffer.from(iv.toString(crypto.enc.Hex), 'hex');
		const encryptedBytes = Buffer.from(encrypted.ciphertext.toString(crypto.enc.Hex), 'hex');

		return Buffer.concat([ivBytes, encryptedBytes]);
	}

	/**
	 * Get current state
	 */
	getState(): any {
		return { ...this.state };
	}

	/**
	 * Manually set state for testing
	 */
	setState(newState: Partial<typeof this.state>): void {
		this.state = { ...this.state, ...newState };
		this.emit('stateChanged', this.state);
	}
}
