import { CacheConfigQiks } from '@medishn/qiks/dist/types/CacheTypes';
import { MemoryCacheStore } from '../../utils/Cache';
export const trustProxyDefaultSymbol = Symbol.for('@@symbol:trust_proxy_default');

/** Enum for predefined settings keys */
export enum KEY_SETTINGS {
  APP_NAME = 'app_name', // Application name
  APP_VERSION = 'app_version', // Application version
  ENVIRONMENT = 'environment', // Current environment ('development' | 'production')
  PATHS = 'paths', // Paths configurations
  CACHE = 'cache',
  SERVER_ID = 'server_id',
  TRUST_PROXY = 'trust_proxy',
  X_POWERED_BY = 'x-powered-by',
  ETAG = 'etag',
}

/** Interface for App Configuration */
export interface AppConfig {
  [KEY_SETTINGS.APP_NAME]?: string;
  [KEY_SETTINGS.APP_VERSION]?: string;
  [KEY_SETTINGS.ENVIRONMENT]?: Environment;
  [KEY_SETTINGS.SERVER_ID]?: string;
  [KEY_SETTINGS.PATHS]?: PathConfig;
  [KEY_SETTINGS.CACHE]?: CacheConfigQiks<string>;
  [KEY_SETTINGS.TRUST_PROXY]?: boolean;
  [KEY_SETTINGS.X_POWERED_BY]?: boolean;
  [KEY_SETTINGS.ETAG]?: string;
  [key: string]: any;
}

export interface PathConfig {
  apiPrefix?: string;
  staticFilesPath?: string;
}

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}
export type GlobalCache = MemoryCacheStore<string, any>;
export type AppConfigKey = keyof typeof KEY_SETTINGS;
export type AppConfigValue = AppConfig[AppConfigKey];
