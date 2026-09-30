/**
 * Dependency injection and module registration.
 *
 * @see Container for the entry point
 * @see Explorer for turning decorator metadata into routes and handlers
 */
export * from './container/container';
export * from './container/module-container';
export * from './instance-wrapper';
export * from './module';
export * from './scanner/dependencies-scanner';
export * from './scanner/metadata-scanner';
export * from './explorer';
export * from './discovery-service';
