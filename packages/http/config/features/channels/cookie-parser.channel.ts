import { Dictionary, isArray, isUndefined, Maybe, merge } from '@medishn/toolkit';
import { createHash } from 'node:crypto';
import { AbstractConfigChannel } from '../config-channel';
import { CookieOptions, GlandMiddleware, HttpContext } from '@gland/http/interface';
import { ConfigChannel } from '../../config.channel';

export class CookieParserChannel extends AbstractConfigChannel<CookieOptions, 'cookies'> {
  constructor(channel: ConfigChannel) {
    super(channel, 'cookies');
  }
  public createMiddleware(): GlandMiddleware {
    return async (ctx, next) => {
      this.attachCookieMethods(ctx);

      this.parseRequestCookies(ctx);

      await next();
    };
  }

  private parseRequestCookies(ctx: HttpContext): void {
    const cookieHeader = ctx.req.headers.cookie;

    if (isUndefined(cookieHeader)) {
      return;
    }

    const cookieString = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
    const cookies: Dictionary<string> = {};
    const signedCookies: Dictionary<string> = {};
    const secret = this.get('secret');
    const pairs = cookieString.split(';');

    for (const pair of pairs) {
      const [name, value] = pair.trim().split('=');

      if (!name || isUndefined(value)) {
        continue;
      }

      const decodedValue = decodeURIComponent(value);

      if (secret && name.endsWith('.sig')) {
        const unsignedName = name.slice(0, -4);
        const unsigned = cookies[unsignedName];

        if (unsigned && this.verifySignedCookie(unsigned, decodedValue)) {
          signedCookies[unsignedName] = unsigned;

          delete cookies[unsignedName];
        }
      } else {
        cookies[name] = decodedValue;
      }
    }

    Object.defineProperty(ctx.req, 'cookies', {
      configurable: true,
      enumerable: true,
      value: cookies,
    });

    if (secret) {
      Object.defineProperty(ctx.req, 'signedCookies', {
        configurable: true,
        enumerable: true,
        value: signedCookies,
      });
    }
  }

  /**
   * Attach cookie methods to the context
   */
  private attachCookieMethods(ctx: HttpContext): void {
    ctx.getCookie = this.getCookie.bind(this, ctx);
    ctx.setCookie = this.setCookie.bind(this, ctx);
    ctx.deleteCookie = this.deleteCookie.bind(this, ctx);
  }

  /**
   * Get a cookie value from the request
   */
  public getCookie(ctx: HttpContext, name: string, options?: { signed?: boolean }): Maybe<string> {
    const signed = options?.signed ?? false;
    const secret = this.get('secret');

    if (signed && secret) {
      return (ctx.req as any).signedCookies?.[name];
    }

    return ctx.cookies?.[name];
  }

  /**
   * Set a cookie in the response
   */
  public setCookie(ctx: HttpContext, name: string, value: string, options?: Partial<CookieOptions>): void {
    const cookieOptions = merge(this.values!, options!).value;
    const secret = this.get('secret');

    let cookieValue = encodeURIComponent(value);
    let cookieHeader = `${name}=${cookieValue}`;

    if (cookieOptions.maxAge !== undefined && cookieOptions.maxAge >= 0) {
      cookieHeader += `; Max-Age=${Math.floor(cookieOptions.maxAge / 1000)}`;
    }

    if (cookieOptions.domain) {
      cookieHeader += `; Domain=${cookieOptions.domain}`;
    }

    cookieHeader += `; Path=${cookieOptions.path || '/'}`;

    if (cookieOptions.secure) {
      cookieHeader += '; Secure';
    }

    if (cookieOptions.httpOnly) {
      cookieHeader += '; HttpOnly';
    }

    if (cookieOptions.sameSite) {
      cookieHeader += `; SameSite=${cookieOptions.sameSite}`;
    }

    if (cookieOptions.signed && secret) {
      const signature = this.signCookie(value);
      const sigName = `${name}.sig`;

      this.setCookie(ctx, sigName, signature, {
        ...cookieOptions,
        signed: false,
      });
    }

    const existingCookies = ctx.header.get('set-cookie');

    if (isArray(existingCookies)) {
      ctx.header.set('set-cookie', [...existingCookies, cookieHeader]);
    } else if (existingCookies) {
      ctx.header.set('set-cookie', [existingCookies, cookieHeader]);
    } else {
      ctx.header.set('set-cookie', [cookieHeader]);
    }
  }

  /**
   * Delete a cookie by setting its expiration to the past
   */
  public deleteCookie(ctx: HttpContext, name: string, options?: Partial<CookieOptions>): void {
    const deleteOptions: Partial<CookieOptions> = {
      ...options,
      maxAge: 0,
    };
    const signed = this.get('signed');

    this.setCookie(ctx, name, '', deleteOptions);

    if (options?.signed || signed) {
      this.setCookie(ctx, `${name}.sig`, '', deleteOptions);
    }
  }

  /**
   * Sign a cookie value using the secret
   */
  private signCookie(value: string): string {
    const secretOption = this.get('secret');
    if (!secretOption) {
      throw new Error('Secret is required for signed cookies');
    }

    const secret = isArray(secretOption) ? secretOption[0] : secretOption;
    return this.hash(`${value}.${secret}`);
  }

  /**
   * Verify a signed cookie value
   */
  private verifySignedCookie(value: string, signature: string): boolean {
    const secretOption = this.get('secret');
    if (!secretOption) {
      return false;
    }

    const secrets = isArray(secretOption) ? secretOption : [secretOption];

    for (const secret of secrets) {
      if (this.hash(`${value}.${secret}`) === signature) {
        return true;
      }
    }

    return false;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}
