import { isArray, isBoolean, isFunction, isRegExp, isString, Maybe } from '@medishn/toolkit';
import { IncomingMessage, ServerResponse } from 'http';
import { AbstractConfigChannel } from '../config-channel';
import { ConfigChannel } from '../../config.channel';
import { CorsConfig, GlandMiddleware, StaticOrigin } from '../../../types';
import { CorsOptions, CorsOptionsDelegate, HttpContext } from '../../../interface';

export class CorsChannel extends AbstractConfigChannel<CorsConfig, 'cors'> {
  constructor(channel: ConfigChannel) {
    super(channel, 'cors');
  }

  public createMiddleware(): GlandMiddleware {
    return async (ctx, next) => {
      this.enable(ctx);

      await next();
    };
  }
  private enable(ctx: HttpContext) {
    if (!this.values) return;
    const { req, res } = ctx;
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

  private processCorsOptions(req: IncomingMessage, callback: (options: Maybe<CorsOptions>) => void) {
    const value = this.values;
    if (isBoolean(value)) {
      callback(value ? {} : null);
    } else if (isFunction(value)) {
      const options = value as CorsOptionsDelegate<IncomingMessage>;
      options(req, (err, options) => {
        callback(err ? null : options);
      });
    } else {
      callback(value!);
    }
  }

  private setOriginHeader(res: ServerResponse, origin: string, options: CorsOptions) {
    const allowedOrigin = this.getAllowedOrigin(origin, options);
    if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }

  private getAllowedOrigin(requestOrigin: string, options: CorsOptions): Maybe<string> {
    const originOption = options.origin;
    if (!originOption || originOption === '*') return '*';

    if (isFunction(originOption)) {
      let result: Maybe<StaticOrigin> = null;
      originOption(requestOrigin, (err, origin) => {
        if (!err && origin) result = origin;
      });
      return this.validateOrigin(requestOrigin, result!);
    }

    return this.validateOrigin(requestOrigin, originOption);
  }

  private validateOrigin(requestOrigin: string, option: StaticOrigin): Maybe<string> {
    if (isBoolean(option)) return requestOrigin ?? '*';
    if (isString(option)) return option === requestOrigin ? option : null;
    if (isRegExp(option)) return option.test(requestOrigin) ? requestOrigin : null;
    if (isArray(option)) {
      return option.some((o) => (isRegExp(o) ? o.test(requestOrigin) : o === requestOrigin)) ? requestOrigin : null;
    }
    return null;
  }

  private setMethodsHeader(res: ServerResponse, options: CorsOptions) {
    if (options.methods) {
      res.setHeader('Access-Control-Allow-Methods', isArray(options.methods) ? options.methods.join(', ') : options.methods!);
    }
  }

  private setAllowedHeadersHeader(res: ServerResponse, options: CorsOptions) {
    if (options.allowedHeaders) {
      res.setHeader('Access-Control-Allow-Headers', isArray(options.allowedHeaders) ? options.allowedHeaders.join(', ') : options.allowedHeaders);
    }
  }

  private setExposedHeadersHeader(res: ServerResponse, options: CorsOptions) {
    if (options.exposedHeaders) {
      res.setHeader('Access-Control-Expose-Headers', isArray(options.exposedHeaders) ? options.exposedHeaders.join(', ') : options.exposedHeaders);
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
