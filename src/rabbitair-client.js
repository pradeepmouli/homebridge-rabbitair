"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitAirClient = exports.RabbitAirSensitivity = exports.RabbitAirQuality = exports.RabbitAirSpeed = exports.RabbitAirMode = void 0;
var crypto_js_1 = require("crypto-js");
var dgram_1 = require("dgram");
var RabbitAirMode;
(function (RabbitAirMode) {
    RabbitAirMode[RabbitAirMode["Auto"] = 0] = "Auto";
    RabbitAirMode[RabbitAirMode["Pollen"] = 1] = "Pollen";
    RabbitAirMode[RabbitAirMode["Manual"] = 2] = "Manual";
})(RabbitAirMode || (exports.RabbitAirMode = RabbitAirMode = {}));
var RabbitAirSpeed;
(function (RabbitAirSpeed) {
    RabbitAirSpeed[RabbitAirSpeed["SuperSilent"] = 0] = "SuperSilent";
    RabbitAirSpeed[RabbitAirSpeed["Silent"] = 1] = "Silent";
    RabbitAirSpeed[RabbitAirSpeed["Low"] = 2] = "Low";
    RabbitAirSpeed[RabbitAirSpeed["Medium"] = 3] = "Medium";
    RabbitAirSpeed[RabbitAirSpeed["High"] = 4] = "High";
    RabbitAirSpeed[RabbitAirSpeed["Turbo"] = 5] = "Turbo";
})(RabbitAirSpeed || (exports.RabbitAirSpeed = RabbitAirSpeed = {}));
var RabbitAirQuality;
(function (RabbitAirQuality) {
    RabbitAirQuality[RabbitAirQuality["Lowest"] = 0] = "Lowest";
    RabbitAirQuality[RabbitAirQuality["Low"] = 1] = "Low";
    RabbitAirQuality[RabbitAirQuality["Medium"] = 2] = "Medium";
    RabbitAirQuality[RabbitAirQuality["High"] = 3] = "High";
    RabbitAirQuality[RabbitAirQuality["Highest"] = 4] = "Highest";
})(RabbitAirQuality || (exports.RabbitAirQuality = RabbitAirQuality = {}));
var RabbitAirSensitivity;
(function (RabbitAirSensitivity) {
    RabbitAirSensitivity[RabbitAirSensitivity["High"] = 0] = "High";
    RabbitAirSensitivity[RabbitAirSensitivity["Medium"] = 1] = "Medium";
    RabbitAirSensitivity[RabbitAirSensitivity["Low"] = 2] = "Low";
})(RabbitAirSensitivity || (exports.RabbitAirSensitivity = RabbitAirSensitivity = {}));
var RabbitAirClient = /** @class */ (function () {
    function RabbitAirClient(config, logger) {
        this.socket = null;
        this.commandId = Math.floor(Math.random() * 0x1000000);
        this.tsDiff = null;
        this.isConnected = false;
        this.TIMEOUT_MS = 10000; // Increased timeout to 10 seconds
        this.MAX_RETRIES = 3;
        this.connectionAttempts = 0;
        this.MAX_CONNECTION_ATTEMPTS = 5;
        this.logger = logger;
        this.host = config.host;
        this.port = config.port || 9009;
        this.logger.debug("Initializing RabbitAirClient for host: ".concat(this.host, ":").concat(this.port));
        if (!config.token || config.token.length !== 32) {
            this.logger.error('Invalid token length. Token must be 32 characters (16 bytes hex)');
            throw new Error('Invalid token length');
        }
        this.token = Buffer.from(config.token, 'hex');
        this.logger.debug("Token loaded successfully (length: ".concat(this.token.length, " bytes)"));
        this.logger.debug("Initial command ID: ".concat(this.commandId));
    }
    RabbitAirClient.prototype.nextId = function () {
        var newId = ++this.commandId;
        this.logger.debug("Generated new command ID: ".concat(newId));
        return newId;
    };
    RabbitAirClient.prototype.getClock = function () {
        var timestamp = Date.now() / 1000;
        this.logger.debug("Current clock time: ".concat(timestamp));
        return timestamp;
    };
    RabbitAirClient.prototype.getTimestamp = function () {
        if (this.tsDiff === null) {
            this.logger.error('Attempting to get timestamp before synchronization');
            throw new Error('Timestamp not synchronized');
        }
        var timestamp = Math.round(this.getClock() + this.tsDiff);
        this.logger.debug("Generated timestamp: ".concat(timestamp, " (tsDiff: ").concat(this.tsDiff, ")"));
        return timestamp;
    };
    RabbitAirClient.prototype.encrypt = function (data) {
        this.logger.debug("Encrypting data (length: ".concat(data.length, " bytes)"));
        // Convert to CryptoJS format
        var key = crypto_js_1.default.enc.Hex.parse(this.token.toString('hex'));
        var iv = crypto_js_1.default.lib.WordArray.random(16);
        var message = crypto_js_1.default.enc.Utf8.parse(data.toString());
        var encrypted = crypto_js_1.default.AES.encrypt(message, key, {
            iv: iv,
            mode: crypto_js_1.default.mode.CBC,
            padding: crypto_js_1.default.pad.Pkcs7
        });
        // Combine encrypted data with IV
        var combined = encrypted.ciphertext.concat(iv);
        var result = Buffer.from(combined.toString(crypto_js_1.default.enc.Base64), 'base64');
        this.logger.debug("Encrypted data (length: ".concat(result.length, " bytes)"));
        return result;
    };
    RabbitAirClient.prototype.decrypt = function (data) {
        this.logger.debug("Decrypting data (length: ".concat(data.length, " bytes)"));
        try {
            // Extract IV from the end of the message
            var iv = data.slice(-16);
            var encrypted = data.slice(0, -16);
            // Convert to CryptoJS format
            var key = crypto_js_1.default.enc.Hex.parse(this.token.toString('hex'));
            var ivWords = crypto_js_1.default.enc.Hex.parse(iv.toString('hex'));
            var encryptedWords = crypto_js_1.default.enc.Hex.parse(encrypted.toString('hex'));
            var decrypted = crypto_js_1.default.AES.decrypt({ ciphertext: encryptedWords }, key, { iv: ivWords, mode: crypto_js_1.default.mode.CBC, padding: crypto_js_1.default.pad.Pkcs7 });
            var result = Buffer.from(decrypted.toString(crypto_js_1.default.enc.Utf8), 'utf8');
            this.logger.debug("Decrypted data (length: ".concat(result.length, " bytes): ").concat(result.toString()));
            return result;
        }
        catch (error) {
            this.logger.error("Decryption failed: ".concat(error));
            throw new Error("Decryption failed: ".concat(error));
        }
    };
    RabbitAirClient.prototype.sendCommand = function (command) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.logger.debug("Sending command: ".concat(JSON.stringify(command)));
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.socket) {
                            _this.logger.error('Cannot send command: Socket not connected');
                            return reject(new Error('Socket not connected'));
                        }
                        var requestId = _this.nextId();
                        command.id = requestId;
                        _this.logger.debug("Command assigned ID: ".concat(requestId));
                        if (_this.token) {
                            _this.logger.debug('Using encrypted communication');
                            if (_this.tsDiff === null) {
                                _this.logger.debug('Timestamp not synchronized, initiating sync');
                                // First, synchronize timestamp
                                var tsRequest_1 = { id: _this.nextId(), cmd: 9 };
                                _this.logger.debug("Sending timestamp sync request: ".concat(JSON.stringify(tsRequest_1)));
                                var tsData = JSON.stringify(tsRequest_1);
                                var encryptedTsData = _this.encrypt(Buffer.from(tsData));
                                _this.socket.send(encryptedTsData, _this.port, _this.host, function (err) {
                                    if (err) {
                                        _this.logger.error("Failed to send timestamp sync request: ".concat(err.message));
                                        reject(err);
                                    }
                                    else {
                                        _this.logger.debug('Timestamp sync request sent successfully');
                                    }
                                });
                                // Wait for timestamp response
                                var onTsMessage_1 = function (msg) {
                                    _this.logger.debug("Received timestamp sync response (".concat(msg.length, " bytes)"));
                                    try {
                                        var decrypted = _this.decrypt(msg);
                                        var response = JSON.parse(decrypted.toString());
                                        _this.logger.debug("Timestamp sync response: ".concat(JSON.stringify(response)));
                                        if (response.id === tsRequest_1.id) {
                                            _this.tsDiff = response.data.ts - _this.getClock();
                                            _this.logger.debug("Timestamp synchronized. Diff: ".concat(_this.tsDiff));
                                            _this.socket.removeListener('message', onTsMessage_1);
                                            // Now send the actual command
                                            command.ts = _this.getTimestamp();
                                            _this.logger.debug("Sending actual command with timestamp: ".concat(JSON.stringify(command)));
                                            var commandData = JSON.stringify(command);
                                            var encryptedCommandData = _this.encrypt(Buffer.from(commandData));
                                            _this.socket.send(encryptedCommandData, _this.port, _this.host, function (err) {
                                                if (err) {
                                                    _this.logger.error("Failed to send command: ".concat(err.message));
                                                    reject(err);
                                                }
                                                else {
                                                    _this.logger.debug('Command sent successfully');
                                                }
                                            });
                                            // Wait for command response
                                            var onCommandMessage_1 = function (msg) {
                                                _this.logger.debug("Received command response (".concat(msg.length, " bytes)"));
                                                try {
                                                    var decrypted_1 = _this.decrypt(msg);
                                                    var response_1 = JSON.parse(decrypted_1.toString());
                                                    _this.logger.debug("Command response: ".concat(JSON.stringify(response_1)));
                                                    if (response_1.id === requestId) {
                                                        _this.socket.removeListener('message', onCommandMessage_1);
                                                        if (response_1.error) {
                                                            _this.logger.error("Command failed with protocol error: ".concat(JSON.stringify(response_1.error)));
                                                            reject(new Error('Protocol error'));
                                                        }
                                                        else {
                                                            _this.logger.debug('Command completed successfully');
                                                            resolve(response_1);
                                                        }
                                                    }
                                                }
                                                catch (error) {
                                                    _this.logger.debug("Ignoring parsing error for unexpected message: ".concat(error));
                                                    // Ignore parsing errors for unexpected messages
                                                }
                                            };
                                            _this.socket.on('message', onCommandMessage_1);
                                            // Set timeout
                                            setTimeout(function () {
                                                _this.socket.removeListener('message', onCommandMessage_1);
                                                _this.logger.error("Command timeout after ".concat(_this.TIMEOUT_MS, "ms"));
                                                reject(new Error('Command timeout'));
                                            }, _this.TIMEOUT_MS);
                                        }
                                    }
                                    catch (error) {
                                        _this.logger.debug("Ignoring parsing error for unexpected timestamp message: ".concat(error));
                                        // Ignore parsing errors for unexpected messages
                                    }
                                };
                                _this.socket.on('message', onTsMessage_1);
                                // Set timeout for timestamp sync
                                setTimeout(function () {
                                    _this.socket.removeListener('message', onTsMessage_1);
                                    _this.logger.error("Timestamp sync timeout after ".concat(_this.TIMEOUT_MS, "ms"));
                                    reject(new Error('Timestamp sync timeout'));
                                }, _this.TIMEOUT_MS);
                            }
                            else {
                                _this.logger.debug('Timestamp already synchronized, sending command directly');
                                // Timestamp already synchronized
                                command.ts = _this.getTimestamp();
                                _this.logger.debug("Sending command with timestamp: ".concat(JSON.stringify(command)));
                                var commandData = JSON.stringify(command);
                                var encryptedCommandData = _this.encrypt(Buffer.from(commandData));
                                _this.socket.send(encryptedCommandData, _this.port, _this.host, function (err) {
                                    if (err) {
                                        _this.logger.error("Failed to send command: ".concat(err.message));
                                        reject(err);
                                    }
                                    else {
                                        _this.logger.debug('Command sent successfully');
                                    }
                                });
                                // Wait for command response
                                var onMessage_1 = function (msg) {
                                    _this.logger.debug("Received command response (".concat(msg.length, " bytes)"));
                                    try {
                                        var decrypted = _this.decrypt(msg);
                                        var response = JSON.parse(decrypted.toString());
                                        _this.logger.debug("Command response: ".concat(JSON.stringify(response)));
                                        if (response.id === requestId) {
                                            _this.socket.removeListener('message', onMessage_1);
                                            if (response.error) {
                                                _this.logger.error("Command failed with protocol error: ".concat(JSON.stringify(response.error)));
                                                reject(new Error('Protocol error'));
                                            }
                                            else {
                                                _this.logger.debug('Command completed successfully');
                                                resolve(response);
                                            }
                                        }
                                    }
                                    catch (error) {
                                        _this.logger.debug("Ignoring parsing error for unexpected message: ".concat(error));
                                        // Ignore parsing errors for unexpected messages
                                    }
                                };
                                _this.socket.on('message', onMessage_1);
                                // Set timeout
                                setTimeout(function () {
                                    if (_this.socket) {
                                        _this.socket.removeListener('message', onMessage_1);
                                    }
                                    _this.logger.error("Command timeout after ".concat(_this.TIMEOUT_MS, "ms"));
                                    reject(new Error('Command timeout'));
                                }, _this.TIMEOUT_MS);
                            }
                        }
                        else {
                            _this.logger.debug('Using unencrypted communication');
                            // No encryption
                            var commandData = JSON.stringify(command);
                            _this.logger.debug("Sending unencrypted command: ".concat(commandData));
                            _this.socket.send(commandData, _this.port, _this.host, function (err) {
                                if (err) {
                                    _this.logger.error("Failed to send unencrypted command: ".concat(err.message));
                                    reject(err);
                                }
                                else {
                                    _this.logger.debug('Unencrypted command sent successfully');
                                }
                            });
                            // Wait for response
                            var onMessage_2 = function (msg) {
                                _this.logger.debug("Received unencrypted response (".concat(msg.length, " bytes): ").concat(msg.toString()));
                                try {
                                    var response = JSON.parse(msg.toString());
                                    _this.logger.debug("Unencrypted response: ".concat(JSON.stringify(response)));
                                    if (response.id === requestId) {
                                        _this.socket.removeListener('message', onMessage_2);
                                        if (response.error) {
                                            _this.logger.error("Unencrypted command failed with protocol error: ".concat(JSON.stringify(response.error)));
                                            reject(new Error('Protocol error'));
                                        }
                                        else {
                                            _this.logger.debug('Unencrypted command completed successfully');
                                            resolve(response);
                                        }
                                    }
                                }
                                catch (error) {
                                    _this.logger.debug("Ignoring parsing error for unexpected unencrypted message: ".concat(error));
                                    // Ignore parsing errors for unexpected messages
                                }
                            };
                            _this.socket.on('message', onMessage_2);
                            // Set timeout
                            setTimeout(function () {
                                if (_this.socket) {
                                    _this.socket.removeListener('message', onMessage_2);
                                }
                                _this.logger.error("Unencrypted command timeout after ".concat(_this.TIMEOUT_MS, "ms"));
                                reject(new Error('Command timeout'));
                            }, _this.TIMEOUT_MS);
                        }
                    })];
            });
        });
    };
    RabbitAirClient.prototype.fallbackUnencryptedCommand = function (command) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.logger.warn('Attempting fallback to unencrypted communication');
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.socket) {
                            _this.logger.error('Cannot send fallback command: Socket not connected');
                            return reject(new Error('Socket not connected'));
                        }
                        var requestId = _this.nextId();
                        command.id = requestId;
                        var commandData = JSON.stringify(command);
                        _this.logger.debug("Sending fallback unencrypted command: ".concat(commandData));
                        _this.socket.send(commandData, _this.port, _this.host, function (err) {
                            if (err) {
                                _this.logger.error("Failed to send fallback command: ".concat(err.message));
                                reject(err);
                            }
                            else {
                                _this.logger.debug('Fallback command sent successfully');
                            }
                        });
                        // Wait for response
                        var onMessage = function (msg) {
                            _this.logger.debug("Received fallback response (".concat(msg.length, " bytes): ").concat(msg.toString()));
                            try {
                                var response = JSON.parse(msg.toString());
                                _this.logger.debug("Fallback response: ".concat(JSON.stringify(response)));
                                if (response.id === requestId) {
                                    _this.socket.removeListener('message', onMessage);
                                    if (response.error) {
                                        _this.logger.error("Fallback command failed: ".concat(JSON.stringify(response.error)));
                                        reject(new Error('Protocol error'));
                                    }
                                    else {
                                        _this.logger.debug('Fallback command completed successfully');
                                        resolve(response);
                                    }
                                }
                            }
                            catch (error) {
                                _this.logger.debug("Ignoring parsing error for unexpected fallback message: ".concat(error));
                            }
                        };
                        _this.socket.on('message', onMessage);
                        // Set timeout
                        setTimeout(function () {
                            if (_this.socket) {
                                _this.socket.removeListener('message', onMessage);
                            }
                            _this.logger.error("Fallback command timeout after ".concat(_this.TIMEOUT_MS, "ms"));
                            reject(new Error('Fallback command timeout'));
                        }, _this.TIMEOUT_MS);
                    })];
            });
        });
    };
    RabbitAirClient.prototype.testConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1, testCommand, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug('Testing connection to device');
                        if (!(!this.socket || !this.isConnected)) return [3 /*break*/, 4];
                        this.logger.debug('Socket not connected, attempting to connect');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.connect()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error("Failed to connect during connection test: ".concat(error_1));
                        return [2 /*return*/, false];
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        testCommand = { cmd: 255 };
                        return [4 /*yield*/, this.sendCommandWithRetry(testCommand, 1)];
                    case 5:
                        result = _a.sent();
                        this.logger.debug('Connection test successful');
                        return [2 /*return*/, !!result];
                    case 6:
                        error_2 = _a.sent();
                        this.logger.error("Connection test failed: ".concat(error_2));
                        // Reset connection state on failure
                        this.isConnected = false;
                        this.tsDiff = null;
                        return [2 /*return*/, false];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RabbitAirClient.prototype.sendCommandWithRetry = function (command_1) {
        return __awaiter(this, arguments, void 0, function (command, retries) {
            var lastError, _loop_1, this_1, attempt, state_1, fallbackError_1;
            if (retries === void 0) { retries = this.MAX_RETRIES; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lastError = null;
                        _loop_1 = function (attempt) {
                            var _b, error_3, delay_1;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 5]);
                                        this_1.logger.debug("Sending command attempt ".concat(attempt, "/").concat(retries));
                                        _b = {};
                                        return [4 /*yield*/, this_1.sendCommand(command)];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        error_3 = _c.sent();
                                        lastError = error_3;
                                        this_1.logger.warn("Command attempt ".concat(attempt, "/").concat(retries, " failed: ").concat(lastError.message));
                                        if (!(attempt < retries)) return [3 /*break*/, 4];
                                        // Reset timestamp diff on retry to force re-sync
                                        if (lastError.message.includes('Timestamp sync timeout')) {
                                            this_1.logger.debug('Resetting timestamp diff due to sync timeout');
                                            this_1.tsDiff = null;
                                        }
                                        delay_1 = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                                        this_1.logger.debug("Waiting ".concat(delay_1, "ms before retry"));
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                    case 3:
                                        _c.sent();
                                        _c.label = 4;
                                    case 4: return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= retries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4:
                        if (!(this.token &&
                            lastError &&
                            lastError.message.includes('Timestamp sync timeout'))) return [3 /*break*/, 8];
                        this.logger.warn('All encrypted attempts failed, trying fallback unencrypted communication');
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.fallbackUnencryptedCommand(command)];
                    case 6: return [2 /*return*/, _a.sent()];
                    case 7:
                        fallbackError_1 = _a.sent();
                        this.logger.error("Fallback communication also failed: ".concat(fallbackError_1));
                        throw lastError; // Throw the original error
                    case 8: throw lastError;
                }
            });
        });
    };
    RabbitAirClient.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error;
            var _this = this;
            return __generator(this, function (_a) {
                this.logger.debug("Attempting to connect to ".concat(this.host, ":").concat(this.port, " (attempt ").concat(this.connectionAttempts + 1, "/").concat(this.MAX_CONNECTION_ATTEMPTS, ")"));
                if (this.isConnected) {
                    this.logger.debug('Already connected, skipping connection');
                    return [2 /*return*/];
                }
                if (this.connectionAttempts >= this.MAX_CONNECTION_ATTEMPTS) {
                    error = new Error("Max connection attempts (".concat(this.MAX_CONNECTION_ATTEMPTS, ") exceeded"));
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
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.socket = (0, dgram_1.createSocket)('udp4');
                        _this.logger.debug('Created UDP socket');
                        // Set up error handling
                        _this.socket.on('error', function (err) {
                            _this.logger.error("Socket error: ".concat(err.message));
                            _this.isConnected = false;
                            reject(err);
                        });
                        _this.socket.on('listening', function () {
                            try {
                                var address = _this.socket.address();
                                _this.logger.debug("Socket listening on ".concat(address.address, ":").concat(address.port));
                                _this.isConnected = true;
                                _this.connectionAttempts = 0; // Reset on successful connection
                                _this.logger.info("Successfully connected to RabbitAir device at ".concat(_this.host, ":").concat(_this.port));
                                resolve();
                            }
                            catch (error) {
                                _this.logger.error("Error getting socket address: ".concat(error));
                                _this.isConnected = false;
                                reject(error);
                            }
                        });
                        // Set a timeout for binding
                        var bindTimeout = setTimeout(function () {
                            _this.logger.error('Socket bind timeout');
                            if (_this.socket) {
                                _this.socket.close();
                                _this.socket = null;
                            }
                            _this.isConnected = false;
                            reject(new Error('Socket bind timeout'));
                        }, 5000);
                        try {
                            _this.socket.bind(function () {
                                clearTimeout(bindTimeout);
                            });
                        }
                        catch (error) {
                            clearTimeout(bindTimeout);
                            _this.logger.error("Failed to bind socket: ".concat(error));
                            reject(error);
                        }
                    })];
            });
        });
    };
    RabbitAirClient.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.logger.debug('Attempting to disconnect');
                if (this.socket) {
                    return [2 /*return*/, new Promise(function (resolve) {
                            _this.socket.close(function () {
                                _this.logger.debug('Socket closed successfully');
                                _this.socket = null;
                                _this.isConnected = false;
                                _this.tsDiff = null;
                                _this.logger.info('Disconnected from RabbitAir device');
                                resolve();
                            });
                        })];
                }
                else {
                    this.logger.debug('No socket to disconnect');
                }
                return [2 /*return*/];
            });
        });
    };
    RabbitAirClient.prototype.getState = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isConnected, response, data, state, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug('Requesting device state');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.testConnection()];
                    case 2:
                        isConnected = _a.sent();
                        if (!isConnected) {
                            throw new Error('Device not reachable');
                        }
                        return [4 /*yield*/, this.sendCommandWithRetry({ cmd: 4 })];
                    case 3:
                        response = _a.sent();
                        data = response.data;
                        if (!data) {
                            this.logger.error('Invalid response data: no data field found');
                            throw new Error('Invalid response data');
                        }
                        state = {
                            power: data.power,
                            mode: data.mode,
                            speed: data.speed,
                            quality: data.quality,
                            sensitivity: data.sensitivity,
                            ionizer: data.ionizer,
                            filterLife: data.filter_life,
                            filterCleaning: data.filter_cleaning,
                            filterReplacement: data.filter_replacement,
                            error: data.error,
                            rssi: data.rssi
                        };
                        this.logger.debug("Device state retrieved: ".concat(JSON.stringify(state)));
                        return [2 /*return*/, state];
                    case 4:
                        error_4 = _a.sent();
                        this.logger.error("Failed to get device state: ".concat(error_4));
                        // Don't disconnect on error - let it retry
                        throw error_4;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    RabbitAirClient.prototype.setState = function (state) {
        return __awaiter(this, void 0, void 0, function () {
            var isConnected, data, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug("Setting device state: ".concat(JSON.stringify(state)));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.testConnection()];
                    case 2:
                        isConnected = _a.sent();
                        if (!isConnected) {
                            throw new Error('Device not reachable');
                        }
                        data = {};
                        if (state.power !== undefined) {
                            data.power = state.power;
                            this.logger.debug("Setting power: ".concat(state.power));
                        }
                        if (state.mode !== undefined) {
                            data.mode = state.mode;
                            this.logger.debug("Setting mode: ".concat(state.mode, " (").concat(RabbitAirMode[state.mode], ")"));
                        }
                        if (state.speed !== undefined) {
                            data.speed = state.speed;
                            this.logger.debug("Setting speed: ".concat(state.speed, " (").concat(RabbitAirSpeed[state.speed], ")"));
                        }
                        if (state.sensitivity !== undefined) {
                            data.sensitivity = state.sensitivity;
                            this.logger.debug("Setting sensitivity: ".concat(state.sensitivity, " (").concat(RabbitAirSensitivity[state.sensitivity], ")"));
                        }
                        if (state.ionizer !== undefined) {
                            data.ionizer = state.ionizer;
                            this.logger.debug("Setting ionizer: ".concat(state.ionizer));
                        }
                        this.logger.debug("Command data to send: ".concat(JSON.stringify(data)));
                        return [4 /*yield*/, this.sendCommandWithRetry({ cmd: 4, data: data })];
                    case 3:
                        _a.sent();
                        this.logger.debug('Device state updated successfully');
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        this.logger.error("Failed to set device state: ".concat(error_5));
                        // Don't disconnect on error - let it retry
                        throw error_5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    RabbitAirClient.prototype.getInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isConnected, response, data, info, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug('Requesting device info');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.testConnection()];
                    case 2:
                        isConnected = _a.sent();
                        if (!isConnected) {
                            throw new Error('Device not reachable');
                        }
                        return [4 /*yield*/, this.sendCommandWithRetry({ cmd: 255 })];
                    case 3:
                        response = _a.sent();
                        data = response.data;
                        info = {
                            name: data.name,
                            mac: data.mac,
                            model: data.model,
                            firmware: data.fv,
                            uptime: data.uptime
                        };
                        this.logger.debug("Device info retrieved: ".concat(JSON.stringify(info)));
                        return [2 /*return*/, info];
                    case 4:
                        error_6 = _a.sent();
                        this.logger.error("Failed to get device info: ".concat(error_6));
                        // Don't disconnect on error - let it retry
                        throw error_6;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    RabbitAirClient.prototype.checkDeviceCapabilities = function () {
        return __awaiter(this, void 0, void 0, function () {
            var supportsEncryption, responsive, unencryptedResult, error_7, encryptedResult, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug('Checking device capabilities');
                        supportsEncryption = false;
                        responsive = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // First try unencrypted communication
                        this.logger.debug('Testing unencrypted communication');
                        return [4 /*yield*/, this.fallbackUnencryptedCommand({
                                cmd: 255
                            })];
                    case 2:
                        unencryptedResult = _a.sent();
                        if (unencryptedResult) {
                            responsive = true;
                            this.logger.debug('Device responds to unencrypted commands');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _a.sent();
                        this.logger.debug("Unencrypted communication failed: ".concat(error_7));
                        return [3 /*break*/, 4];
                    case 4:
                        if (!this.token) return [3 /*break*/, 8];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        // Try encrypted communication
                        this.logger.debug('Testing encrypted communication');
                        return [4 /*yield*/, this.sendCommand({ cmd: 255 })];
                    case 6:
                        encryptedResult = _a.sent();
                        if (encryptedResult) {
                            supportsEncryption = true;
                            responsive = true;
                            this.logger.debug('Device supports encrypted communication');
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        error_8 = _a.sent();
                        this.logger.debug("Encrypted communication failed: ".concat(error_8));
                        return [3 /*break*/, 8];
                    case 8:
                        this.logger.info("Device capabilities: responsive=".concat(responsive, ", supportsEncryption=").concat(supportsEncryption));
                        return [2 /*return*/, { supportsEncryption: supportsEncryption, responsive: responsive }];
                }
            });
        });
    };
    RabbitAirClient.prototype.maintainConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug('Maintaining connection to device');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!(!this.socket || !this.isConnected)) return [3 /*break*/, 3];
                        this.logger.debug('Connection lost, attempting to reconnect');
                        return [4 /*yield*/, this.connect()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.sendCommandWithRetry({ cmd: 255 }, 1)];
                    case 4:
                        response = _a.sent();
                        if (response) {
                            this.logger.debug('Keep-alive successful');
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_9 = _a.sent();
                        this.logger.warn("Keep-alive failed: ".concat(error_9));
                        // Reset connection state
                        this.isConnected = false;
                        this.tsDiff = null;
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Add graceful shutdown method
    RabbitAirClient.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug('Shutting down RabbitAir client');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        if (!this.socket) return [3 /*break*/, 3];
                        this.socket.removeAllListeners();
                        return [4 /*yield*/, this.disconnect()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_10 = _a.sent();
                        this.logger.error("Error during shutdown: ".concat(error_10));
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return RabbitAirClient;
}());
exports.RabbitAirClient = RabbitAirClient;
