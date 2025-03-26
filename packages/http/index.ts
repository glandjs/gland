/*
 * Gland HTTP Module
 * Copyright(c) 2024 - 2025 Mahdi
 * MIT Licensed
 *
 *
 * The `@gland/http` package provides a fully event-driven HTTP/HTTPS server based on the Gland framework.
 * It is designed to work seamlessly with `@gland/core`, leveraging the Event-Driven System (EDS)
 *
 * @example
 * ```ts
 * import { HttpCore } from '@gland/http';
 * const app = new HttpCore();
 *
 * app.get('/', (ctx) => {
 *   ctx.send('Hello, Gland!');
 * });
 *
 * app.listen(3000);
 * ```
 * @since 1.0.0
 */
export * from './http-core';
export * from './http-events.const';
