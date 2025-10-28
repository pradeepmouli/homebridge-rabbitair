"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var platform_js_1 = require("./platform.js");
var settings_js_1 = require("./settings.js");
/**
 * This method registers the platform with Homebridge
 */
exports.default = (function (api) {
    api.registerPlatform(settings_js_1.PLATFORM_NAME, platform_js_1.RabbitAirPlatform);
});
