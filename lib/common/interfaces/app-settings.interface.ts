import { CacheConfigQiks } from '@medishn/qiks/dist/types/CacheTypes';
import { Environment, KEY_SETTINGS } from '../enums';
import { BodyParserOptions } from './app.interface';

/** Interface for App Configuration */
export interface AppConfig {
  [KEY_SETTINGS.APP_NAME]?: string;
  [KEY_SETTINGS.APP_VERSION]?: string;
  [KEY_SETTINGS.ENVIRONMENT]?: keyof typeof Environment;
  [KEY_SETTINGS.SERVER_ID]?: string;
  [KEY_SETTINGS.PATHS]?: PathConfig;
  [KEY_SETTINGS.CACHE]?: CacheConfigQiks<string>;
  [KEY_SETTINGS.BODY_PARSER]?: BodyParserOptions;
  [KEY_SETTINGS.TRUST_PROXY]?: boolean;
  [KEY_SETTINGS.X_POWERED_BY]?: boolean;
  [KEY_SETTINGS.ETAG]?: string;
  [key: string]: any;
}

export interface PathConfig {
  apiPrefix?: string;
  staticFilesPath?: string;
}
