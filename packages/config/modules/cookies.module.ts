import { DynamicModule, ensureObject, Module } from '@gland/common';
import { COOKIES_METADATA } from '../constant';
import { CookieOptions } from '../interface/config.interface';
import { CookiesService } from '../services/cookies.service';

@Module({})
export class CookiesModule {
  static forRoot(options: CookieOptions): DynamicModule {
    return {
      module: CookiesModule,
      providers: [
        {
          provide: COOKIES_METADATA.COOKIES_WATERMARK,
          useValue: ensureObject(options),
        },
        CookiesService,
      ],
      exports: [CookiesService],
    };
  }
}
