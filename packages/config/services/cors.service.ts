import { Inject, Injectable, isBoolean, isFunction, isString } from '@gland/common';
import { CORS_METADATA } from '../constant';
import { IncomingMessage, ServerResponse } from 'http';
import { CorsConfig, StaticOrigin } from '../types';
import { CorsOptions } from '../interface';
/**
 * @service CorsService
 * @description Service for handling Cross-Origin Resource Sharing (CORS) headers
 */
@Injectable()
export class CorsService {
  constructor(@Inject(CORS_METADATA.CORS_WATERMARK) private readonly options: CorsConfig) {}

  enableCors(res: ServerResponse) {
    if (!this.options) return;

    const req = res.req;
    const origin = req.headers.origin!;

    this.processCorsOptions(req, (corsOptions) => {
      if (!corsOptions) return;

      // Set CORS headers
      this.setOriginHeader(res, origin, corsOptions);
      this.setMethodsHeader(res, corsOptions);
      this.setAllowedHeadersHeader(res, corsOptions);
      this.setExposedHeadersHeader(res, corsOptions);
      this.setCredentialsHeader(res, corsOptions);
      this.setMaxAgeHeader(res, corsOptions);
    });
  }

  private processCorsOptions(req: IncomingMessage, callback: (options: CorsOptions | null) => void) {
    if (typeof this.options === 'boolean') {
      callback(this.options ? {} : null);
    } else if (typeof this.options === 'function') {
      this.options(req, (err, options) => {
        callback(err ? null : options);
      });
    } else {
      callback(this.options!);
    }
  }

  private setOriginHeader(res: ServerResponse, origin: string, options: CorsOptions) {
    const allowedOrigin = this.getAllowedOrigin(origin, options);
    if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }

  private getAllowedOrigin(requestOrigin: string, options: CorsOptions): string | null {
    const originOption = options.origin;
    if (!originOption || originOption === '*') return '*';

    if (isFunction(originOption)) {
      let result: StaticOrigin | null = null;
      originOption(requestOrigin, (err, origin) => {
        if (!err && origin) result = origin;
      });
      return this.validateOrigin(requestOrigin, result!);
    }

    return this.validateOrigin(requestOrigin, originOption);
  }

  private validateOrigin(requestOrigin: string, option: StaticOrigin): string | null {
    if (isBoolean(option)) return requestOrigin ?? '*';
    if (isString(option)) return option === requestOrigin ? option : null;
    if (option instanceof RegExp) return option.test(requestOrigin) ? requestOrigin : null;
    if (Array.isArray(option)) {
      return option.some((o) => (o instanceof RegExp ? o.test(requestOrigin) : o === requestOrigin)) ? requestOrigin : null;
    }
    return null;
  }

  private setMethodsHeader(res: ServerResponse, options: CorsOptions) {
    if (options.methods) {
      res.setHeader('Access-Control-Allow-Methods', Array.isArray(options.methods) ? options.methods.join(', ') : options.methods);
    }
  }

  private setAllowedHeadersHeader(res: ServerResponse, options: CorsOptions) {
    if (options.allowedHeaders) {
      res.setHeader('Access-Control-Allow-Headers', Array.isArray(options.allowedHeaders) ? options.allowedHeaders.join(', ') : options.allowedHeaders);
    }
  }

  private setExposedHeadersHeader(res: ServerResponse, options: CorsOptions) {
    if (options.exposedHeaders) {
      res.setHeader('Access-Control-Expose-Headers', Array.isArray(options.exposedHeaders) ? options.exposedHeaders.join(', ') : options.exposedHeaders);
    }
  }

  private setCredentialsHeader(res: ServerResponse, options: CorsOptions) {
    if (options.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  private setMaxAgeHeader(res: ServerResponse, options: CorsOptions) {
    if (options.maxAge) {
      res.setHeader('Access-Control-Max-Age', options.maxAge.toString());
    }
  }
}
