import { Environment, EtagIdentifier, TtlIdentifier } from '@gland/common';
import { TrustProxyOption } from '../types/config.types';

export interface ProxyServiceConfig {
  trustProxy?: TrustProxyOption;
  proxyTrustCount?: number;
  proxyIpHeader?: string;
}

export interface CookieOptions {
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  domain?: string;
  path?: string;
  maxAge?: number;
}

export interface ViewsEnginesOptions {
  engine: 'ejs' | 'hbs' | 'pug';
  cacheTemplates?: boolean;
}

export interface GlobalSettings {
  env?: Environment;
  etag?: EtagIdentifier;
  poweredBy?: string | boolean;
}
