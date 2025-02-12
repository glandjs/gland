import { DynamicModule, ensureObject, Module } from '@gland/common';
import { VIEWS_METADATA } from '../constant';
import { ViewsService } from '../services';
import { ViewsConfig } from '../interface';
/**
 * @module ViewsModule
 */
@Module({})
export class ViewsModule {
  static forRoot(options: ViewsConfig): DynamicModule {
    return {
      module: ViewsModule,
      providers: [
        {
          provide: VIEWS_METADATA.VIEWS_WATERMARK,
          useValue: ensureObject(options),
        },
        ViewsService,
      ],
      exports: [ViewsService],
    };
  }
}
