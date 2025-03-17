import { isNil } from '@medishn/toolkit';
import { HttpContext, HttpHeaderValue, SettingsOptions } from '../../interface';
import { GlandMiddleware } from '../../types';
import { AbstractPlugins } from '../abstract-plugins';
import { ConfigChannel } from '../../config';
import { generateETag } from '../utils';

export class SettingsChannel extends AbstractPlugins<SettingsOptions, 'settings'> {
  constructor(channel: ConfigChannel) {
    super(channel, 'settings');
  }

  createMiddleware(): GlandMiddleware {
    return async (ctx, next) => {
      if (this.get('poweredBy')) {
        ctx.header.set('x-powered-by', this.get('poweredBy'));
      }
      ctx.subdomains = this._getSubdomains(ctx);

      const clientValidation = {
        etag: ctx.header.get('if-none-match'),
        modifiedSince: ctx.header.get('if-modified-since'),
      };

      await next();

      if (this.shouldProcessValidation(ctx)) {
        this.handleCacheValidation(ctx, clientValidation);
      }
    };
  }

  private handleCacheValidation(
    ctx: HttpContext,
    clientValidation: {
      etag: HttpHeaderValue<any, any> | undefined;
      modifiedSince: HttpHeaderValue<any, any> | undefined;
    },
  ) {
    const etag = this.get('etag');
    const strength = etag?.strength ?? 'strong';
    const algorithm = etag?.algorithm ?? 'sha256';
    const serverETag = generateETag(ctx.body, algorithm, strength);
    ctx.header.set('etag', serverETag);

    if (clientValidation.etag) {
      const clientETags = clientValidation.etag
        .toString()
        .split(',')
        .map((t) => t.trim());
      if (this.anyETagMatches(clientETags, serverETag)) {
        this.sendNotModified(ctx);
        return;
      }
    }

    if (clientValidation.modifiedSince) {
      const lastModifiedHeader = ctx.header.get('last-modified');
      if (lastModifiedHeader) {
        const lastModified = this.parseDate(lastModifiedHeader.toString());
        const modifiedSince = this.parseDate(clientValidation.modifiedSince.toString());

        if (lastModified && modifiedSince && lastModified <= modifiedSince) {
          this.sendNotModified(ctx);
          return;
        }
      }
    }
  }

  private anyETagMatches(clientETags: string[], serverETag: string): boolean {
    return clientETags.some((clientETag) => {
      if (clientETag === '*') return true;
      return this.normalizeETag(clientETag) === this.normalizeETag(serverETag);
    });
  }

  private sendNotModified(ctx: HttpContext): void {
    ctx.status = 304;
    ctx.body = null;
    ctx.header.remove('content-type');
    ctx.header.remove('content-length');
  }
  private normalizeETag(etag: string): string {
    return etag.replace(/^W\//i, '').replace(/"/g, '');
  }

  private parseDate(dateString: string): Date | null {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  public compareETags(clientETag: string, serverETag: string): boolean {
    if (!clientETag || !serverETag) return false;

    if (clientETag === '*') return true;

    if (clientETag.includes(',')) {
      return clientETag
        .split(',')
        .map((tag) => tag.trim())
        .some((tag) => this.compareETags(tag, serverETag));
    }

    return this.normalize(clientETag) === this.normalize(serverETag);
  }

  private normalize(etag: string): string {
    return etag.replace(/^W\//, '').replace(/"/g, '');
  }

  private shouldProcessValidation(ctx: HttpContext): boolean {
    return (ctx.method === 'GET' || ctx.method === 'HEAD') && ctx.status >= 200 && ctx.status < 300 && ctx.body && !ctx.header.get('etag');
  }

  private _getSubdomains(ctx: HttpContext) {
    const host = ctx.host;

    if (isNil(host)) {
      return [];
    }
    const hostname = host.split(':')[0];
    if (this._isIPAddress(hostname)) {
      return [];
    }

    const offset = this.get('subdomainOffset')!;

    const segments = hostname.split('.');

    const subdomains = segments.slice(0, segments.length - offset);
    return subdomains.reverse();
  }

  private _isIPAddress(str: string): boolean {
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (ipv4Regex.test(str)) {
      const parts = str.split('.').map((part) => parseInt(part, 10));
      return parts.every((part) => part >= 0 && part <= 255);
    }

    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Regex.test(str);
  }
}
