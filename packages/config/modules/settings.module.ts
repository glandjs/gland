import { DynamicModule, ensureObject, Module } from '@gland/common';
import { SettingsService } from '../services';
import { SettingsConfig } from '../interface';
import { GLOBAL_METADATA } from '../constant';
/**
 * SettingsModule provides configuration management across the application.
 * @public
 */
@Module({})
export class SettingsModule {
  static forRoot(config?: SettingsConfig): DynamicModule {
    return {
      module: SettingsModule,
      providers: [
        {
          provide: GLOBAL_METADATA.GLOBAL_WATERMARK,
          useValue: ensureObject(config),
        },
        SettingsService,
      ],
      exports: [SettingsService],
    };
  }
}
