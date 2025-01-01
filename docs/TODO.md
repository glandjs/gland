# TODO for Gland v2

## Phase 1: Core Refactoring

- [ ] Refactor the core architecture to make it fully object-oriented.
- [ ] Replace `.confmodule` with `gland.config.ts` for configuration.
- [ ] Implement module-based architecture for routers, middlewares, and services.
- [ ] Use `@medishn/logger` for logging throughout the framework.
- [ ] Ensure clean and readable code structure with short, expressive names.
- [ ] Develop comprehensive unit tests for the core.

## Phase 2: Router Enhancements

- [ ] Implement decorators for routing (`@Controller`, `@Get`, `@Post`, etc.).
- [ ] Support nested routes and dynamic parameter parsing.
- [ ] Add route metadata and documentation generation.
- [ ] Introduce multilingual route support with `@MultiLang`.

## Phase 3: Middleware System

- [ ] Design a middleware pipeline with support for async functions.
- [ ] Add a built-in body parser middleware.
- [ ] Implement request transformation middleware (`@Transform`).
- [ ] Enable global, route-specific, and grouped middleware.

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

- [ ] Implement a `@Guard` decorator for route protection.
- [ ] Support reusable guard logic (e.g., authentication and permissions).
- [ ] Integrate guards seamlessly with middleware.

### Caching System

- [ ] Build a caching system with `@Cache` decorator for routes.
- [ ] Support configurable `ttl` and custom cache stores.
- [ ] Integrate with `@medishn/qiks` for advanced caching options.

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
