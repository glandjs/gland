import { Environment } from '@gland/common';
import { CookieOptions, HttpsOptions, ProxyOptions, SettingsConfig, ViewsConfig } from './interface';
import { CorsConfig } from './types';
import { normalizeTrustProxy } from './utils';
import * as constants from 'constants';
export namespace DefaultConfig {
  const MAX_AGE = 86400;
  export function getCorsConfig(): CorsConfig {
    return {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      credentials: false,
      allowedHeaders: '*',
      exposedHeaders: '',
      maxAge: MAX_AGE,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }
  export function getCookieConfig(): CookieOptions {
    return {
      secure: false,
      httpOnly: true,
      sameSite: 'Lax',
      domain: '',
      path: '/',
      maxAge: MAX_AGE,
      signed: false,
    };
  }
  export function getProxyConfig(): ProxyOptions {
    return {
      trustProxy: normalizeTrustProxy(),
      proxyTrustCount: 1,
      proxyIpHeader: 'X-Forwarded-For',
    };
  }
  export function getSettingsConfig(): SettingsConfig {
    return {
      env: Environment.DEVELOPMENT,
      etag: 'weak',
      poweredBy: 'Gland',
      caseSensitiveRouting: false,
      strictQueryParsing: false,
      jsonSpaces: 2,
      subdomainOffset: 2,
    };
  }
  export function getViewsConfig(): ViewsConfig {
    return {
      directory: 'views',
      engine: {
        name: 'ejs',
        cache: true,
      },
    };
  }
  export function getHttpsConfig(): HttpsOptions {
    return {
      ciphers: ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_AES_128_GCM_SHA256'].join(':'),
      honorCipherOrder: true,
      secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
      requestCert: false,
      rejectUnauthorized: true,
      pfx: undefined,
      key: undefined,
      cert: undefined,
      ca: undefined,
      crl: undefined,
      passphrase: undefined,
      SNICallback: undefined,
      NPNProtocols: ['http/1.1', 'http/2'],
    };
  }
}
