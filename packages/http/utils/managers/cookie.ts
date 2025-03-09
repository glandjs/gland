import { Dictionary, isArray, isUndefined, Maybe } from '@medishn/toolkit';
import { CookieOptions, HttpHeaders } from '../../interface';
import { ApplicationConfigurationDefaults } from '../../config';

export class CookiesManager {
  private static readonly COOKIE_HEADER = 'cookie';
  private static readonly SET_COOKIE_HEADER = 'set-cookie';

  constructor(private header: HttpHeaders) {}

  public set(name: string, value: string, options?: Partial<CookieOptions>): void {
    const cookieHeader = this.buildCookieHeader(name, value, { ...ApplicationConfigurationDefaults.cookie, ...options });

    const existingCookies = this.header.get(CookiesManager.SET_COOKIE_HEADER);

    if (isArray(existingCookies)) {
      this.header.set(CookiesManager.SET_COOKIE_HEADER, [...existingCookies, cookieHeader]);
    } else if (existingCookies) {
      this.header.set(CookiesManager.SET_COOKIE_HEADER, [existingCookies, cookieHeader]);
    } else {
      this.header.set(CookiesManager.SET_COOKIE_HEADER, [cookieHeader]);
    }
  }

  public delete(name: string, options?: Partial<CookieOptions>): void {
    const deleteOptions: Partial<CookieOptions> = {
      ...options,
      maxAge: 0,
    };

    this.set(name, '', deleteOptions);
  }

  public get(name: string): Maybe<string> {
    const cookies = this.parseCookies();
    return cookies[name];
  }

  private buildCookieHeader(name: string, value: string, options: CookieOptions): string {
    let cookie = `${name}=${encodeURI(value)}`;

    if (options.maxAge !== undefined && options.maxAge >= 0) {
      cookie += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
    }

    if (options.domain) {
      cookie += `; Domain=${options.domain}`;
    }

    cookie += `; Path=${options.path || '/'}`;

    if (options.secure) {
      cookie += '; Secure';
    }

    if (options.httpOnly) {
      cookie += '; HttpOnly';
    }

    if (options.sameSite) {
      cookie += `; SameSite=${options.sameSite}`;
    }

    return cookie;
  }

  private parseCookies(): Dictionary<string> {
    const result: Dictionary<string> = {};
    const cookieHeader = this.header.get(CookiesManager.COOKIE_HEADER);

    if (isUndefined(cookieHeader)) {
      return result;
    }

    const cookieString = isArray(cookieHeader) ? cookieHeader.join('; ') : String(cookieHeader);

    const pairs = cookieString.split(';');

    for (const pair of pairs) {
      const [name, value] = pair.trim().split('=');
      if (name && !isUndefined(value)) {
        result[name] = decodeURIComponent(value);
      }
    }

    return result;
  }
}
