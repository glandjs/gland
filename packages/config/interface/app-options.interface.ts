import { CookieOptions, SettingsConfig, HttpsOptions, ProxyOptions, ViewsConfig, JsonBodyOptions, UrlEncodedBodyOptions, RawBodyOptions, ForceCloseConnectionsOptions } from '.';
import { CorsConfig } from '../types';

export interface ApplicationOptions {
  /**
   * Global application settings.
   */
  settings?: SettingsConfig;

  /**
   * CORS configuration.
   * @default false
   */
  cors?: CorsConfig;

  /**
   * Cookie configuration.
   */
  cookies?: CookieOptions;

  /**
   * Views and static file configuration.
   */
  views?: ViewsConfig;

  /**
   * Proxy configuration.
   */
  proxy?: ProxyOptions;

  /**
   * HTTPS configuration.
   */
  https?: HttpsOptions;

  /**
   * JSON body parsing options.
   * @default { limit: '1mb', strict: true }
   */
  json?: JsonBodyOptions;

  /**
   * URL-encoded body parsing options.
   * @default { limit: '1mb', extended: true }
   */
  urlencoded?: UrlEncodedBodyOptions;

  /**
   * Whether to force close connections on shutdown.
   * @default false
   */
  forceCloseConnections?: ForceCloseConnectionsOptions;

  /**
   * Raw body parsing options.
   * @default {limit: '1mb', encoding: null }
   */
  rawBody?: RawBodyOptions;
}
