import { CorsOptions, Environment, EtagIdentifier, TtlIdentifier } from '@gland/common';
import { TrustProxyOption } from '../types/config.types';
export interface CookieConfig {
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  domain?: string;
  path?: string;
  maxAge?: number;
}
export interface IConfigSettings {
  etag?: EtagIdentifier;
  subdomainOffset?: number;

  maxIpsCount?: number;

  poweredBy?: string | boolean;

  cors?: CorsOptions;
}

export interface IConfigCache {
  ttl: TtlIdentifier;
}

export interface IConfigEngines {
  engine: 'ejs' | 'hbs' | 'pug';
  cacheTemplates?: boolean;
}

export interface IConfigCore {
  env?: Environment;
  caching?: IConfigCache;
  proxy?: boolean;
  cookies?: CookieConfig;
  views?: {
    directory: string | string[];
    engine?: IConfigEngines;
  };
  trustProxy?: TrustProxyOption;
  proxyIpHeader?: string;
  proxyTrustCount?: number;
}
/**
 * Defines the overall structure for the configuration object.
 */
export interface ConfigOptions {
  settings?: IConfigSettings;
  core?: IConfigCore;
}
