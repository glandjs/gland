import { CustomOrigin, Environment, EntityTagOptions, RequestMethod, StaticOrigin, TrustProxyOption } from '@gland/common';

export interface CorsOptionsCallback {
  (error: Error | null, options: CorsOptions): void;
}
export interface CorsOptionsDelegate<T> {
  (req: T, cb: CorsOptionsCallback): void;
}

export interface CorsOptions {
  /**
   * Configures the `Access-Control-Allow-Origin` CORS header.
   * @default '*'
   */
  origin?: StaticOrigin | CustomOrigin;

  /**
   * Configures the `Access-Control-Allow-Methods` CORS header.
   * @default 'GET,HEAD,PUT,PATCH,POST,DELETE'
   */
  methods?: keyof typeof RequestMethod | (keyof typeof RequestMethod)[];

  /**
   * Configures the `Access-Control-Allow-Headers` CORS header.
   */
  allowedHeaders?: string | string[];

  /**
   * Configures the `Access-Control-Expose-Headers` CORS header.
   */
  exposedHeaders?: string | string[];

  /**
   * Configures the `Access-Control-Allow-Credentials` CORS header.
   * @default false
   */
  credentials?: boolean;

  /**
   * Configures the `Access-Control-Max-Age` CORS header.
   */
  maxAge?: number;

  /**
   * Whether to pass the CORS preflight response to the next handler.
   * @default false
   */
  preflightContinue?: boolean;

  /**
   * Provides a status code to use for successful `OPTIONS` requests.
   * @default 204
   */
  optionsSuccessStatus?: number;
}

export interface ProxyOptions {
  /**
   * Whether to trust proxy headers (e.g., X-Forwarded-For).
   * @default TRUST_PROXY_DEFAULT_SYMBOL
   */
  trustProxy?: TrustProxyOption;

  /**
   * Number of proxies to trust when `trustProxy` is enabled.
   * @default 1
   */
  proxyTrustCount?: number;

  /**
   * Header to use for the client's IP address.
   * @default 'X-Forwarded-For'
   */
  proxyIpHeader?: string;
}

export interface CookieOptions {
  /**
   * Whether the cookie is only sent over HTTPS.
   * @default false
   */
  secure?: boolean;

  /**
   * Whether the cookie is inaccessible to client-side JavaScript.
   * @default true
   */
  httpOnly?: boolean;

  /**
   * Configures the `SameSite` attribute for cookies.
   * @default 'Lax'
   */
  sameSite?: 'Strict' | 'Lax' | 'None';

  /**
   * Domain name for the cookie.
   */
  domain?: string;

  /**
   * Path for the cookie.
   * @default '/'
   */
  path?: string;

  /**
   * Maximum age of the cookie in seconds.
   */
  maxAge?: number;

  /**
   * Whether to sign the cookie for tamper protection.
   * @default false
   */
  signed?: boolean;

  /**
   * @default 'default-cookie-secret'
   */
  secret: string;
}

export type ViewsOptions = {
  /**
   * Directory or directories to serve static files from.
   * @default views
   */
  directory?: string | string[];

  /**
   * Template engine configuration.
   */
  engine?: {
    /**
     * Template engine to use (e.g., 'ejs', 'pug', 'hbs').
     * @default ejs
     */
    name: 'ejs' | 'pug' | 'hbs';

    /**
     * Whether to cache compiled templates.
     * @default true in production, false in development
     */
    cache?: boolean;
  };
};

export interface SettingsOptions {
  /**
   * Application environment (e.g., 'development', 'production').
   * @default 'development'
   */
  env?: Environment;

  /**
   * ETag configuration for HTTP caching.
   * @default '{strength:'weak',algorithm:sha256'}'
   */
  etag?: EntityTagOptions;

  /**
   * Whether to include the 'X-Powered-By' header.
   * @default Gland
   */
  poweredBy?: string;

  /**
   * Whether to enable strict routing (case-sensitive routes).
   * @default false
   */
  caseSensitiveRouting?: boolean;

  /**
   * Whether to enable strict parsing of query strings.
   * @default false
   */
  strictQueryParsing?: boolean;

  /**
   * Whether to enable JSON spaces for pretty-printed JSON responses.
   * @default 2
   */
  jsonSpaces?: number;

  /**
   * Whether to enable subdomain routing.
   * @default 2
   */
  subdomainOffset?: number;

  /**
   * global prefix app
   * @default /
   */
  globalPrefix?: string;
}

interface JsonParserOptions {
  strict: boolean;
  reviver?: (key: string, value: any) => any;
}

interface UrlEncodedParserOptions {
  extended: boolean;
}
export interface BodyParserOptions {
  limit: number;
  encoding: string;
  json: JsonParserOptions;
  urlencoded: UrlEncodedParserOptions;
}

export interface ShutdownOptions {
  /**
   * Whether to force close connections on shutdown.
   * @default false
   */
  forceCloseConnections?: boolean;
}
export interface HttpsOptions {
  pfx?: any;

  key?: any;
  passphrase?: string;

  cert?: any;

  ca?: any;

  crl?: any;

  ciphers?: string;

  honorCipherOrder?: boolean;

  requestCert?: boolean;

  rejectUnauthorized?: boolean;

  NPNProtocols?: any;

  SNICallback?: (servername: string, cb: (err: Error, ctx: any) => any) => any;

  secureOptions?: number;
}
