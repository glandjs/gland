import { DynamicModule, Module } from '@gland/common';
import { CORS_METADATA } from '../constant';
import { CorsService } from '../services/cors.service';
import { CorsConfig } from '../types/config.types';
/**
 * @module CorsModule
 * @description The CorsModule enables Cross-Origin Resource Sharing (CORS) functionality for the application.
 * It provides global configuration options and the service for handling CORS headers.
 */
@Module({})
export class CorsModule {
  static forRoot(options: CorsConfig): DynamicModule {
    return {
      module: CorsModule,

      providers: [
        {
          provide: CORS_METADATA.CORS_WATERMARK,
          useValue: options,
        },
        CorsService,
      ],
      exports: [CorsService],
    };
  }
}
