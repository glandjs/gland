/**
 * @glandjs/core
 *
 * The transport-agnostic heart of Gland: module registration, dependency
 * injection, metadata discovery, and the event bus that protocol adapters
 * attach to.
 *
 * ```ts
 * import { GlandFactory } from '@glandjs/core';
 *
 * const { app, shutdown } = await GlandFactory.create(AppModule);
 * app.connectTo(ExpressBroker).listen(3000);
 * ```
 *
 * @packageDocumentation
 */
import 'reflect-metadata';

export * from './adapter';
export * from './application';
export * from './context';
export * from './gland-broker';
export * from './gland-factory';
export * from './hooks';
export * from './injector';
export * from './types';
