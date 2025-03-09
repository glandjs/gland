import { HttpsOptions, ProxyOptions, ViewsOptions, CookieOptions, SettingsOptions, BodyParserOptions, ShutdownOptions } from './http-options.interface';
import { CorsConfig } from '../types';

export interface HttpApplicationOptions {
  /**
   * Global application settings.
   */
  settings?: SettingsOptions;

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
  body?: BodyParserOptions;

  /**
   * Graceful shutdown configuration
   */
  shutdown?: ShutdownOptions;

  /**
   * Views Config
   */
  views?: ViewsOptions;
}
