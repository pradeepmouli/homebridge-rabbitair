# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-07-16

### Added
- Detailed logging throughout RabbitAirClient methods for better debugging and traceability
- Retry logic for command sending with improved error handling
- Connection testing with fallback to unencrypted communication when encrypted attempts fail
- Graceful shutdown method for RabbitAirClient
- Device capability checking (encryption support and responsiveness)
- ESLint and Prettier configuration for code quality and formatting
- .eslintignore file to exclude unnecessary files from linting

### Changed
- Increased command timeout from default to 10 seconds for better reliability
- Updated RabbitAirClient constructor to accept a logger instance
- Enhanced connection handling with automatic fallback mechanisms
- Improved error handling and logging across all client methods

### Technical Improvements
- Added comprehensive logging for connection attempts, command sending, and responses
- Implemented automatic retry mechanisms for failed commands
- Enhanced device discovery and connection reliability
- Improved code formatting and linting rules

## [1.0.1] - 2025-07-12

### Added
- GitHub workflow for automated releases and npm publishing
- Initial release automation infrastructure

## [1.0.0] - 2025-07-12

### Added
- Initial complete implementation of RabbitAir Homebridge plugin
- Support for RabbitAir air purifier devices in HomeKit
- Core plugin functionality including device discovery and control
- Basic platform and accessory implementations
- Configuration schema for Homebridge
- TypeScript support and build configuration
- Initial documentation and setup instructions

### Features
- Air purifier power control through HomeKit
- Device status monitoring and reporting
- Automatic device discovery on local network
- Integration with Homebridge ecosystem
- Support for multiple RabbitAir devices