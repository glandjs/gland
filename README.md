# Gland

**Gland** is an innovative, lightweight, and extensible web framework for Node.js. Built with an object-oriented philosophy and inspired by frameworks like Angular and NestJS, Gland leverages a fully event-driven architecture, robust dependency injection, and metadata reflection to deliver unparalleled flexibility in building scalable, modular web applications.

> **Status:** Under active development – Expect breaking changes and rapid evolution as new features are integrated.

## Packages Overview

Gland is structured as a monorepo with a set of interdependent packages, each responsible for a distinct area of functionality:

- **@gland/core:**  
  The framework's engine, managing application bootstrapping, routing, middleware execution, and the DI container.

- **@gland/common:**  
  Shared utilities, base decorators, constants, interfaces, and helper functions used across the framework.

- **@gland/config:**  
  Dynamic configuration management, including environment-based configuration and schema validation.

- **@gland/debug:**  
  Debugging tools and logging services to monitor application state and performance.

- **@gland/events:**  
  The backbone of Gland’s event-driven architecture, providing a unified system for emitting and listening to application events.

- **@gland/testing:**  
  Tools and utilities for unit and integration testing, including mocks and helper functions.

- **@gland/validators:**  
  A schema-based validation system with decorators and rules to enforce data integrity.

- **@gland/cache:**  
  Caching mechanisms and strategies (e.g., in-memory, Redis) to improve application performance.

## Contributing

We welcome contributions to help shape Gland into a robust, production-ready framework. To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Write tests and update documentation as needed.
4. Submit a pull request with a detailed description of your changes.

Please review our [CONTRIBUTING.md](docs/CONTRIBUTING.md) guidelines before getting started.

---

## Security

For details on security practices and how to report vulnerabilities, please see [SECURITY.md](docs/SECURITY.md).

---

## License

Gland is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For questions, suggestions, or further information, please contact us at [bitsgenix@gmail.com](mailto:bitsgenix@gmail.com).

---

> **Note:** Gland is actively under development. We appreciate your patience as we continue to improve the framework and welcome your feedback and contributions!
