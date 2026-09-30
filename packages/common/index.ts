/**
 * @glandjs/common
 *
 * Framework-agnostic primitives: decorators, metadata keys, event-name
 * helpers, and shared types.
 *
 * This package has no runtime dependency on `@glandjs/core` and knows nothing
 * about transports, which is what lets protocol adapters and applications
 * share one vocabulary.
 *
 * @packageDocumentation
 */
import 'reflect-metadata';

export * from './constant';
export * from './decorators';
export * from './interfaces';
export * from './types';
export * from './utils';
