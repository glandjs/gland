import { Module } from '@glandjs/common';

/**
 * The entry module.
 *
 * Nothing is listed here on purpose: this sample resolves providers directly
 * rather than discovering them from metadata, so the module exists only to give
 * the container something to start from.
 */
@Module({})
export class AppModule {}
