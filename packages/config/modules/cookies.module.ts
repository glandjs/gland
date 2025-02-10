import { DynamicModule, Module } from '@gland/common';
import { COOKIES_METADATA } from '../constant';
import { CookieOptions } from '../interface/config.interface';

@Module({})
export class CookieModule {
  static forRoot(options: CookieOptions): DynamicModule {
    return {
      module: CookieModule,
      providers: [
        {
          provide: COOKIES_METADATA.COOKIES_WATERMARK,
          useValue: options,
        },
      ],
      exports: [CookieModule],
    };
  }
}
