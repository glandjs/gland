import { DynamicModule, Module } from '@gland/common';
import { ConfigService } from '../services/global.service';
import { GlobalSettings } from '../interface/config.interface';
import { GLOBAL_METADATA } from '../constant';
/**
 * GlobalModule provides configuration management across the application.
 * @public
 */
@Module({})
export class GlobalModule {
  static forRoot(config?: GlobalSettings): DynamicModule {
    return {
      module: GlobalModule,
      providers: [
        {
          provide: GLOBAL_METADATA.GLOBAL_WATERMARK,
          useValue: config,
        },
      ],
      exports: [ConfigService],
    };
  }
}
