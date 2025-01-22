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

### Input Validation

- [x] Create a `@Validate` decorator for request validation.
- [x] Implement validation rules for body, query, and headers.
- [x] Support custom validation rules and error handling.

### Global Guards

- [x] Implement a `@Guard` decorator for route protection.

### Caching System

- [x] Support configurable `ttl` and custom cache stores.
- [x] Integrate with `@medishn/qiks` for advanced caching options.

### Phase 5: New Features

#### Error Management

- [ ] Design structured error objects.
- [ ] Enhance error middleware for async errors.
- [ ] Allow user-defined error handlers.
- [ ] Write tests for various error scenarios.
- [ ] Document custom error handling.

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
