# Changelog

## [1.0.0-alpha.1] - 2025-03-28

### Added

- **Core Framework**: Initial alpha release of the Gland framework with core packages:
  - `@glandjs/core`: Dependency Injection (DI), basic framework setup.
  - `@glandjs/http`: HTTP server handling (routes, controllers).
  - `@glandjs/events`: Event-driven architecture with support for various protocols.
  - `@glandjs/common`: Common decorators and utilities (like `@Module`, `@Controller`, `@Get`, etc.).
- **Example project**: Added a small example showcasing the use of Gland framework, including routing and event handling.
  - Example: [Very Simple Example](https://github.com/glandjs/gland/blob/main/examples/very-simple.ts)

### Changes

- **Package name**: Renamed from `gland` to `glandjs` due to an existing namespace on npm. All the packages have been published under `@glandjs`.

### Known Issues

- **HTTP Static Methods**: Some static methods in the HTTP package are currently non-functional.
- **Minor bugs**: As this is an alpha release, there might be bugs and instability in some of the features.

### New Contributors

- @xDefyingGravity
- @masih-developer
