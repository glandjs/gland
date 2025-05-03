Thought for a few seconds

Below is a comprehensive security policy tailored for both the `@glandjs/core` and `@glandjs/common` packages. It follows GitHub’s recommended SECURITY.md structure and covers supported versions, general security considerations, best practices, and responsible disclosure guidelines.

---

## Summary

This document outlines GlandJS’s security policy for its core architectural packages—`@glandjs/core` and `@glandjs/common` (currently at version **1.0.1‑alpha**). It describes which versions are supported, highlights key security considerations specific to dependency injection and shared utilities, prescribes best practices for safe usage, and defines a clear, private reporting and response process for vulnerabilities. All contributors and consumers should follow these guidelines to ensure GlandJS remains robust against potential threats.

## Supported Versions

| Package           | Version     | Supported |
| ----------------- | ----------- | :-------: |
| `@glandjs/core`   | 1.0.1‑alpha |  ✅ Yes   |
| `@glandjs/common` | 1.0.1‑alpha |  ✅ Yes   |

We provide security fixes only for the above versions. Versions older than **1.0.1‑alpha** are no longer maintained and users are strongly encouraged to upgrade.

---

## Security Considerations

Both `@glandjs/core` (the protocol-agnostic DI + event‑sync engine) and `@glandjs/common` (shared decorators, interfaces, utilities) live at the heart of GlandJS’s modular architecture. While neither package performs network I/O directly, misuse or misconfiguration can still introduce vulnerabilities.

### Trust Boundaries

- **Core vs. External Layers**
  Keep your application’s external entry points (HTTP controllers, WebSocket handlers, RPC adapters) separate from internal event flows. Only wire trusted modules into the `@glandjs/core` broker channels.
- **Decorator Usage**
  Only apply decorators from `@glandjs/common` on classes and methods you control. Avoid dynamically constructing modules or injecting third‑party classes without explicit validation.

### Input Handling & Validation

- **Sanitize All Inputs**
  Any payload flowing through event channels (e.g. data emitted via `EventBroker`) must be validated or sanitized—even if it originates from internal code—before passing it to other listeners or modules.
- **Immutable Data Patterns**
  Treat event payloads and shared data objects as immutable. If a listener needs to transform data, clone or map it rather than mutating the original object to avoid side‑effects.

### Error Management

- **Centralized Error Hook**
  Use a dedicated error‑handling channel in `@glandjs/core` (e.g. an `"error"` namespace) to catch and log exceptions from asynchronous listeners.
- **Avoid Silent Failures**
  If a listener throws, propagate the error to the central broker or to the caller so that you never lose sight of critical failures.

### Resource Isolation

- **Module Scoping**
  Keep modules and channels small and single‑purpose. Do not share state between unrelated modules unless explicitly intended.
- **Minimal Privileges**
  Only grant each module access to the broker channels and utilities it requires—do not expose the entire `@glandjs/common` toolkit to untrusted code.

## Reporting a Vulnerability

We value responsible disclosure. If you find a security issue in either `@glandjs/core` or `@glandjs/common`, please:

1. **Do not create a public issue.**
2. **Email us privately** at [bitsgenix@gmail.com](mailto:bitsgenix@gmail.com) with:

   - **Subject:** `[SECURITY] @glandjs/{core|common}`
   - **Details:**

     - Package name and version
     - Description of the vulnerability
     - Steps to reproduce (minimal repro if possible)
     - Impact assessment
     - Suggested fix (optional)

We will acknowledge receipt within 48 hours and keep you updated on our progress toward a patch and public advisory.

## Response & Disclosure

- **Acknowledgement:** Within 2 business days.
- **Fix Timeline:** Critical fixes targeted within 7 days; medium/low within 14 days.
- **Advisory Publication:** We will release a public advisory on GitHub and npm once a fix is ready—credits to the reporter will be provided unless requested otherwise.

<small>_Last updated: May 3, 2025_</small>
