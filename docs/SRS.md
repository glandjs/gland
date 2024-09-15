# Software Requirements Specification (SRS)

## Introduction

### Purpose

This document provides a detailed Software Requirements Specification (SRS) for the Gland framework. It outlines the requirements for the system, including functional and non-functional requirements, to ensure that the framework meets its intended use.

### Scope

Gland is a Node.js web server framework designed to provide a modular, flexible, and efficient way to build web applications. The framework includes features such as middleware support, routing, and an internal logger and query runner.

## Functional Requirements

### Middleware

- The framework must support the addition and execution of middleware functions.
- Middleware functions should be able to modify the request and response objects and invoke the next middleware in the chain.

### Routing

- The framework must support defining routes using decorators (`@Route`, `@Get`, `@Post`, etc.).
- Routes should be able to handle different HTTP methods and provide responses to client requests.

### Configuration

- The framework should support loading configuration modules from specified paths.
- Configuration should allow setting various options such as log level, caching, and module patterns.

### Logging

- The framework must integrate with the internal logger package (`@medishn/gland-logger`).
- Logging should be configurable and include different log levels.

### Query Runner

- The framework must integrate with the internal query runner (`@medishn/gland-qiu`).
- It should support SQL databases including MySQL, MariaDB, and PostgreSQL.

## Non-Functional Requirements

### Performance

- The framework must handle high loads efficiently and process requests with minimal latency.
- The performance of the framework should be benchmarked and optimized for scalability.

### Security

- The framework must follow security best practices to protect against common vulnerabilities.
- Regular security updates should be provided to address any identified issues.

### Usability

- The framework should provide clear and concise documentation for users.
- Examples and usage guides should be included to facilitate ease of use.

## System Architecture

### Components

- **WebServer**: Manages HTTP requests and responses, handles middleware, and routes.
- **Logger**: Handles logging and provides configurable log levels.
- **Query Runner**: Manages SQL queries and supports multiple database types.

### Dependencies

- **Node.js**: The runtime environment for executing the Gland framework.
- **Additional Packages**: Internal dependencies such as `@medishn/gland-logger` and `@medishn/gland-qiu`.

## Glossary

- **Middleware**: Functions that process requests and responses in a web server.
- **Routing**: The process of mapping URLs to specific handlers or controllers.
- **Configuration**: Settings and options that control the behavior of the framework.
- **Logging**: The process of recording events and messages for debugging and monitoring.
- **Query Runner**: A component that executes SQL queries and interacts with databases.

For more details on the system design and architecture, please refer to the project's documentation.