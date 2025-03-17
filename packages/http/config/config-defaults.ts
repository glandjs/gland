import { HttpStatus } from '@medishn/toolkit';
import { BodyParserOptions, CookieOptions, ProxyOptions, SettingsOptions, ViewsOptions } from '../interface';
import { normalizeTrustProxy } from '../plugins/utils';
import type { CorsConfig } from '../types';

export class ApplicationConfigurationDefaults {
  private static readonly ONE_DAY_SECONDS = 86400;
  static get cors(): CorsConfig {
    return {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      credentials: false,
      allowedHeaders: '*',
      exposedHeaders: '',
      maxAge: ApplicationConfigurationDefaults.ONE_DAY_SECONDS,
      preflightContinue: false,
      optionsSuccessStatus: HttpStatus.NO_CONTENT,
    };
  }
  static get cookie(): CookieOptions {
    return {
      secure: false,
      httpOnly: true,
      sameSite: 'Lax',
      domain: '',
      path: '/',
      maxAge: ApplicationConfigurationDefaults.ONE_DAY_SECONDS * 1000,
      signed: false,
      secret: 'default-cookie-secret',
    };
  }
  static get proxy(): ProxyOptions {
    return {
      trustProxy: normalizeTrustProxy(),
      proxyTrustCount: 1,
      proxyIpHeader: 'x-forwarded-for',
    };
  }
  static get settings(): SettingsOptions {
    return {
      etag: {
        algorithm: 'sha256',
        strength: 'weak',
      },
      globalPrefix: '/',
      poweredBy: 'Gland',
      subdomainOffset: 2,
    };
  }
  static get views(): ViewsOptions {
    return {
      directory: 'views',
      engine: {
        name: 'ejs',
        cache: true,
      },
    };
  }
  static get bodyParser(): BodyParserOptions {
    return {
      limit: 1024 * 1024,
      encoding: 'utf-8',
      json: {
        strict: true,
        reviver: undefined,
      },
      urlencoded: {
        extended: true,
      },
    };
  }
  static get shutdown() {
    return { forceCloseConnections: false };
  }
}
