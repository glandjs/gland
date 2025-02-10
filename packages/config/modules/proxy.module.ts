import { DynamicModule, Module } from '@gland/common';
import { PROXY_METADATA } from '../constant';
import { ProxyServiceConfig } from '../interface/config.interface';
import { ProxyService } from '../services/proxy.service';
/**
 * @module ProxyModule
 * @description this module handles proxy settings and trusted proxies it lets you configure trust proxy options like the number of trusted hops and the header for client ip addresses you can use it to check if a request is from a trusted source based on rules or custom logic it supports dynamic configuration with the forRoot method so you can customize it easily
 */
@Module({})
export class ProxyModule {
  static forRoot(options?: ProxyServiceConfig): DynamicModule {
    return {
      module: ProxyModule,
      providers: [
        {
          provide: PROXY_METADATA.PROXY_WATERMARK,
          useValue: options ?? {},
        },
      ],
      exports: [ProxyService],
    };
  }
}
