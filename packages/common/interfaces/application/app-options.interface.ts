import { CorsConfig } from '@gland/common';
import { SettingsConfig, HttpsOptions, ProxyOptions, JsonBodyOptions, UrlEncodedBodyOptions, RawBodyOptions, ForceCloseConnectionsOptions, ViewsConfig, CookieOptions } from '.';

export interface ApplicationOptions {
  /**
   * Global application settings.
   */
  settings?: SettingsConfig;

  /**
   * Proxy configuration.
   */
  proxy?: ProxyOptions;

  /**
   * HTTPS configuration.
   */
  https?: HttpsOptions;

  /**
   * CORS configuration for cross-origin requests
   * @default {origin: *, methods:  ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'], maxAge: 86400,credentials: false,allowedHeaders:'*',exposedHeaders:'',preflightContinue:false,optionsSuccessStatus:204}
   */
  cors?: CorsConfig;

  /**
   * Cookie security configuration
   * @default {secure: false, httpOnly: true, sameSite: 'Lax',domain:'',path:'/',maxAge:86400,signed:false}
   */
  cookies?: CookieOptions;

  /**
   * Body parsing configuration with security limits
   */
  body?: {
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
     * Raw body parsing options.
     * @default {limit: '1mb', encoding: null }
     */
    rawBody?: RawBodyOptions;
  };

  /**
   * Graceful shutdown configuration
   */
  shutdown?: {
    /**
     * Whether to force close connections on shutdown.
     * @default false
     */
    forceCloseConnections?: ForceCloseConnectionsOptions;
  };

  /**
   * Views Config
   */
  views?: ViewsConfig;
}
