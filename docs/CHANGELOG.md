# Changelog

## [1.0.0] - 2024-09-15

### Added
- Initial release of Gland framework with core features including middleware support, custom routing, and integration with internal logging and SQL query runners.
Initial release with the following features:
- Basic server setup and middleware support.
- Routing with decorators (`@Route`, `@Get`, etc.).
- Configuration loading from `.confmodule` files.
- [Gland Logger](https://github.com/medishen/gland-logger) for configurable logging.
- [Qiu](https://github.com/medishen/gland-qiu) for SQL query execution with support for MySQL, MariaDB, and PostgreSQL.
- Basic framework setup with middleware support and routing.
- Project initialization with basic structure and setup.
- Initial project setup and configuration.

### Performance
- Benchmark tests demonstrated efficient request handling with high throughput.

### Documentation
- Added detailed documentation including FAQ, contributing guidelines, and security policy.

## [1.0.2] - 2024-09-15

### Added
- Currently, the load method accepts arguments in the form of objects and there is no need to load a file.

### Changed
- logger and qiu dependencies are removed along with their documents

## [1.1.0] - 2024-09-16

### Added
- **Batch Loading Support**: Implemented batch loading of routes with a configurable batch size of 10 to improve the efficiency of module loading, especially with a large number of routes.
- **File Watcher**: Added a file watcher feature to reload modules dynamically when the files change. This can be enabled via the `watch` option in the configuration.
- **Route Parsing**: Enhanced configuration parsing to support the definition of multiple routes under the `router` section. The routes are automatically resolved based on the provided configuration file.
  
### Changed
- **Improved Configuration Handling**: The module loader now merges the default configuration with the provided configuration, ensuring proper handling of missing or optional fields like `path`, `routes`, `cache`, and `watch`.
  
### Fixed
- **Error Handling**: Improved error handling for missing routes in the configuration file. A clear error message is now thrown if no routes are specified.
  
### Performance Improvements
- **Module Caching**: Added caching logic to prevent redundant module imports, leading to faster performance when caching is enabled.
  
## [1.1.1] - 2024.09.16

### fix
- remove console.logs