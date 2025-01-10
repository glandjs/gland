import { CacheConfigQiks } from '@medishn/qiks/dist/types/CacheTypes';
import { MemoryCacheStore } from '../../utils/Cache';

/** Enum for predefined settings keys */
export enum KEY_SETTINGS {
  APP_NAME = 'app_name', // Application name
  APP_VERSION = 'app_version', // Application version
  ENVIRONMENT = 'environment', // Current environment ('development' | 'production')
  PATHS = 'paths', // Paths configurations
  CACHE = 'cache',
}

/** Interface for App Configuration */
export interface AppConfig {
  [KEY_SETTINGS.APP_NAME]?: string;
  [KEY_SETTINGS.APP_VERSION]?: string;
  [KEY_SETTINGS.ENVIRONMENT]?: Environment;
  [KEY_SETTINGS.PATHS]?: PathConfig;
  [KEY_SETTINGS.CACHE]?: CacheConfigQiks<string>;
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
