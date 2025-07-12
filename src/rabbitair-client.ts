import { createSocket, Socket } from 'dgram';
import CryptoJS from 'crypto-js';

export enum RabbitAirMode {
  Auto = 0,
  Pollen = 1,
  Manual = 2,
}

export enum RabbitAirSpeed {
  SuperSilent = 0,
  Silent = 1,
  Low = 2,
  Medium = 3,
  High = 4,
  Turbo = 5,
}

export enum RabbitAirQuality {
  Lowest = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Highest = 4,
}

export enum RabbitAirSensitivity {
  High = 0,
  Medium = 1,
  Low = 2,
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

export class RabbitAirClient {
  private socket: Socket | null = null;
  private host: string;
  private port: number;
  private token: Buffer;
  private commandId = Math.floor(Math.random() * 0x1000000);
  private tsDiff: number | null = null;
  private isConnected = false;

  constructor(config: RabbitAirConfig) {
    this.host = config.host;
    this.port = config.port || 9009;
    
    if (!config.token || config.token.length !== 32) {
      throw new Error('Invalid token length. Token must be 32 characters (16 bytes hex)');
    }
    
    this.token = Buffer.from(config.token, 'hex');
  }

  private nextId(): number {
    return ++this.commandId;
  }

  private getClock(): number {
    return Date.now() / 1000;
  }

  private getTimestamp(): number {
    if (this.tsDiff === null) {
      throw new Error('Timestamp not synchronized');
    }
    return Math.round(this.getClock() + this.tsDiff);
  }

  private encrypt(data: Buffer): Buffer {
    // Convert to CryptoJS format
    const key = CryptoJS.enc.Hex.parse(this.token.toString('hex'));
    const iv = CryptoJS.lib.WordArray.random(16);
    const message = CryptoJS.enc.Utf8.parse(data.toString());
    
    const encrypted = CryptoJS.AES.encrypt(message, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    
    // Combine encrypted data with IV
    const combined = encrypted.ciphertext.concat(iv);
    return Buffer.from(combined.toString(CryptoJS.enc.Base64), 'base64');
  }

  private decrypt(data: Buffer): Buffer {
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
      { iv: ivWords, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
    );
    
    return Buffer.from(decrypted.toString(CryptoJS.enc.Utf8), 'utf8');
  }

  private async sendCommand(command: Record<string, unknown>): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket not connected'));
      }

      const requestId = this.nextId();
      command.id = requestId;

      if (this.token) {
        if (this.tsDiff === null) {
          // First, synchronize timestamp
          const tsRequest = { id: this.nextId(), cmd: 9 };
          const tsData = JSON.stringify(tsRequest);
          const encryptedTsData = this.encrypt(Buffer.from(tsData));
          
          this.socket.send(encryptedTsData, this.port, this.host, (err) => {
            if (err) {
              reject(err);
            }
          });
          
          // Wait for timestamp response
          const onTsMessage = (msg: Buffer) => {
            try {
              const decrypted = this.decrypt(msg);
              const response = JSON.parse(decrypted.toString());
              
              if (response.id === tsRequest.id) {
                this.tsDiff = response.data.ts - this.getClock();
                this.socket!.removeListener('message', onTsMessage);
                
                // Now send the actual command
                command.ts = this.getTimestamp();
                const commandData = JSON.stringify(command);
                const encryptedCommandData = this.encrypt(Buffer.from(commandData));
                
                this.socket!.send(encryptedCommandData, this.port, this.host, (err) => {
                  if (err) {
                    reject(err);
                  }
                });
                
                // Wait for command response
                const onCommandMessage = (msg: Buffer) => {
                  try {
                    const decrypted = this.decrypt(msg);
                    const response = JSON.parse(decrypted.toString());
                    
                    if (response.id === requestId) {
                      this.socket!.removeListener('message', onCommandMessage);
                      if (response.error) {
                        reject(new Error('Protocol error'));
                      } else {
                        resolve(response);
                      }
                    }
                  } catch (error) {
                    // Ignore parsing errors for unexpected messages
                  }
                };
                
                this.socket!.on('message', onCommandMessage);
                
                // Set timeout
                setTimeout(() => {
                  this.socket!.removeListener('message', onCommandMessage);
                  reject(new Error('Command timeout'));
                }, 5000);
              }
            } catch (error) {
              // Ignore parsing errors for unexpected messages
            }
          };
          
          this.socket.on('message', onTsMessage);
          
          // Set timeout for timestamp sync
          setTimeout(() => {
            this.socket!.removeListener('message', onTsMessage);
            reject(new Error('Timestamp sync timeout'));
          }, 5000);
        } else {
          // Timestamp already synchronized
          command.ts = this.getTimestamp();
          const commandData = JSON.stringify(command);
          const encryptedCommandData = this.encrypt(Buffer.from(commandData));
          
          this.socket.send(encryptedCommandData, this.port, this.host, (err) => {
            if (err) {
              reject(err);
            }
          });
          
          // Wait for command response
          const onMessage = (msg: Buffer) => {
            try {
              const decrypted = this.decrypt(msg);
              const response = JSON.parse(decrypted.toString());
              
              if (response.id === requestId) {
                this.socket!.removeListener('message', onMessage);
                if (response.error) {
                  reject(new Error('Protocol error'));
                } else {
                  resolve(response);
                }
              }
            } catch (error) {
              // Ignore parsing errors for unexpected messages
            }
          };
          
          this.socket.on('message', onMessage);
          
          // Set timeout
          setTimeout(() => {
            if (this.socket) {
              this.socket.removeListener('message', onMessage);
            }
            reject(new Error('Command timeout'));
          }, 5000);
        }
      } else {
        // No encryption
        const commandData = JSON.stringify(command);
        this.socket.send(commandData, this.port, this.host, (err) => {
          if (err) {
            reject(err);
          }
        });
        
        // Wait for response
        const onMessage = (msg: Buffer) => {
          try {
            const response = JSON.parse(msg.toString());
            
            if (response.id === requestId) {
              this.socket!.removeListener('message', onMessage);
              if (response.error) {
                reject(new Error('Protocol error'));
              } else {
                resolve(response);
              }
            }
          } catch (error) {
            // Ignore parsing errors for unexpected messages
          }
        };
        
        this.socket.on('message', onMessage);
        
        // Set timeout
        setTimeout(() => {
          if (this.socket) {
            this.socket.removeListener('message', onMessage);
          }
          reject(new Error('Command timeout'));
        }, 5000);
      }
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.socket = createSocket('udp4');
      
      this.socket.on('error', (err) => {
        reject(err);
      });

      this.socket.on('listening', () => {
        this.isConnected = true;
        resolve();
      });

      this.socket.bind();
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      return new Promise((resolve) => {
        this.socket!.close(() => {
          this.socket = null;
          this.isConnected = false;
          this.tsDiff = null;
          resolve();
        });
      });
    }
  }

  async getState(): Promise<RabbitAirState> {
    const response = await this.sendCommand({ cmd: 4 });
    const data = response.data as Record<string, unknown>;
    
    return {
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
      rssi: data.rssi as number,
    };
  }

  async setState(state: Partial<RabbitAirState>): Promise<void> {
    const data: Record<string, unknown> = {};
    
    if (state.power !== undefined) {
      data.power = state.power;
    }
    if (state.mode !== undefined) {
      data.mode = state.mode;
    }
    if (state.speed !== undefined) {
      data.speed = state.speed;
    }
    if (state.sensitivity !== undefined) {
      data.sensitivity = state.sensitivity;
    }
    if (state.ionizer !== undefined) {
      data.ionizer = state.ionizer;
    }
    
    await this.sendCommand({ cmd: 4, data: data });
  }

  async getInfo(): Promise<RabbitAirInfo> {
    const response = await this.sendCommand({ cmd: 255 });
    const data = response.data as Record<string, unknown>;
    
    return {
      name: data.name as string,
      mac: data.mac as string,
      model: data.model as string,
      firmware: data.fv as string,
      uptime: data.uptime as number,
    };
  }
}