# TODO for Gland v2

## Phase 1: Core Refactoring

- [x] Refactor the core architecture to make it fully object-oriented.
- [x] Replace `.confmodule` with `gland.config.ts` for configuration.
- [x] Implement module-based architecture for routers, middlewares, and services.

## Phase 2: Router Enhancements

- [x] Implement decorators for routing (`@Controller`, `@Get`, `@Post`, etc.).
- [x] Support nested routes and dynamic parameter parsing.
- [x] Introduce multilingual route support with `@MultiLang`.

## Phase 3: Middleware System

- [x] Design a middleware pipeline with support for async functions.
- [x] Add a built-in body parser middleware.
- [x] Implement request transformation middleware (`@Transform`).
- [x] Enable global, route-specific, and grouped middleware.

## Phase 4: New Features

### Rate Limiting

- [ ] Build a `@RateLimit` decorator with customizable options.
- [ ] Support global and per-route rate limits.
- [ ] Test rate limiting under various conditions.

### Input Validation

- [ ] Create a `@Validate` decorator for request validation.
- [ ] Implement validation rules for body, query, and headers.
- [ ] Support custom validation rules and error handling.

### CLI Tool

- [ ] Develop a CLI tool for scaffolding and server management.
- [ ] Add commands for generating controllers, middlewares, and modules.
- [ ] Include server start, stop, and monitoring capabilities.
- [ ] Add debugging tools to identify misconfigurations.

### Global Guards

- [x] Implement a `@Guard` decorator for route protection.

### Caching System

- [x] Support configurable `ttl` and custom cache stores.
- [x] Integrate with `@medishn/qiks` for advanced caching options.

### Event System

- [ ] Enhance the built-in event system for route and application-level events.
- [ ] Add hooks for lifecycle events (e.g., `onInit`, `onDestroy`).
- [ ] Provide APIs for custom event handling.

## Phase 5: Advanced Router Features

- [ ] Add automatic Swagger (OpenAPI) documentation generation.
- [ ] Implement request-response lifecycle hooks for extensibility.
- [ ] Introduce grouped routes with shared middleware and guards.
- [ ] Create a powerful and expressive query builder or ORM (optional).

## Phase 6: Testing and Documentation

- [ ] Write comprehensive test cases for all features.
- [ ] Document all new features with examples and detailed explanations.
- [ ] Provide migration guides from v1 to v2.
- [ ] Write a complete `README.md` for the repository.

## Phase 7: Finalization and Release

- [ ] Optimize performance for production use.
- [ ] Conduct extensive real-world testing.
- [ ] Publish the new version to npm.
- [ ] Announce the release with detailed changelogs and updates.

---

### Notes:

- All features must avoid external dependencies unless necessary.
- Ensure compatibility with Node.js LTS versions.
- Follow clean code and solid OOP principles throughout the implementation.
