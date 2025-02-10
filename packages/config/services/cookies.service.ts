import { Inject, Injectable } from '@gland/common';
import { COOKIES_METADATA } from '../constant';
import { CookieOptions } from '../interface/config.interface';
import { IncomingMessage, ServerResponse } from 'http';

@Injectable()
export class CookiesService {
  constructor(@Inject(COOKIES_METADATA.COOKIES_WATERMARK) private readonly options: CookieOptions) {
    this.options = this.normalizeCookieConfig(options);
  }
  /**
   * Normalizes the cookie configuration to ensure consistent behavior.
   */
  private normalizeCookieConfig(config: CookieOptions): CookieOptions {
    return {
      secure: config.secure ?? false,
      httpOnly: config.httpOnly ?? true,
      sameSite: config.sameSite ?? 'Lax',
      domain: config.domain ?? undefined,
      path: config.path ?? '/',
      maxAge: config.maxAge ?? undefined,
    };
  }

  public setCookie(res: ServerResponse, name: string, value: string, options: CookieOptions = {}): void {
    const cookieOptions = { ...this.options, ...options };
    const cookieHeader = this.buildCookieHeader(name, value, cookieOptions);
    res.setHeader('Set-Cookie', cookieHeader);
  }

  /**
   * Builds the `Set-Cookie` header string.
   */
  private buildCookieHeader(name: string, value: string, options: CookieOptions): string {
    const parts: string[] = [`${name}=${encodeURIComponent(value)}`];

    if (options.maxAge) {
      parts.push(`Max-Age=${options.maxAge}`);
    }

    if (options.domain) {
      parts.push(`Domain=${options.domain}`);
    }

    if (options.path) {
      parts.push(`Path=${options.path}`);
    }

    if (options.secure) {
      parts.push('Secure');
    }

    if (options.httpOnly) {
      parts.push('HttpOnly');
    }

    if (options.sameSite) {
      parts.push(`SameSite=${options.sameSite}`);
    }

    return parts.join('; ');
  }

  /**
   * Parses cookies from the request headers.
   */
  public parseCookies(req: IncomingMessage): Record<string, string> {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return {};

    return cookieHeader.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {} as Record<string, string>);
  }

  /**
   * Gets a specific cookie by name from the request.
   */
  public getCookie(req: IncomingMessage, name: string): string | undefined {
    const cookies = this.parseCookies(req);
    return cookies[name];
  }

  /**
   * Deletes a cookie by setting its expiration to the past.
   */
  public deleteCookie(res: ServerResponse, name: string, options: Partial<CookieOptions> = {}): void {
    const cookieOptions = { ...this.options, ...options, maxAge: -1 };
    this.setCookie(res, name, '', cookieOptions);
  }
}
