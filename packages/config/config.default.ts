import { Environment } from '@gland/common';
import { ConfigOptions } from './interface/config.interface';
import { normalizeTrustProxy } from './utils/shared.util';

export function defaultConfig(config: ConfigOptions): {
  core: ConfigOptions['core'];
  settings: ConfigOptions['settings'];
} {
  const coreConfig = defaultCoreConfig(config.core);
  const settingsConfig = defaultSettingsConfig(config.settings);
  return {
    core: coreConfig,
    settings: settingsConfig,
  };
}
export function defaultCoreConfig(core: ConfigOptions['core']): ConfigOptions['core'] {
  return {
    env: core?.env ?? Environment.DEVELOPMENT,
    trustProxy: normalizeTrustProxy(core?.trustProxy),

    caching: core?.caching ?? {
      ttl: 3600000,
    },

    cookies: core?.cookies ?? {
      domain: undefined,
      httpOnly: true,
      maxAge: 86400 * 1000, // 1 day
      path: '/',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },

    proxy: core?.proxy ?? false,

    proxyIpHeader: core?.proxyIpHeader ?? 'X-Forwarded-For',

    proxyTrustCount: core?.proxyTrustCount ?? 1,

    views: core?.views ?? {
      directory: ['/views'],
      engine: {
        engine: 'ejs',
        cacheTemplates: true,
      },
    },
  };
}
export function defaultSettingsConfig(settings: ConfigOptions['settings']): ConfigOptions['settings'] {
  return {
    etag: settings?.etag ?? 'strong',

    poweredBy: settings?.poweredBy ?? 'Gland',

    subdomainOffset: settings?.subdomainOffset ?? 2,

    maxIpsCount: settings?.maxIpsCount ?? 5,

    cors: settings?.cors ?? {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      exposedHeaders: ['Authorization', 'Content-Length'],
      maxAge: 86400,
      optionsSuccessStatus: 204,
      preflightContinue: false,
    },
  };
}
