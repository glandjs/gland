import { IncomingMessage } from 'http';
import { isEmpty, isString, isUndefined } from '@medishn/toolkit';
import { AbstractPlugins } from '../abstract-plugins';
import { normalizeTrustProxy, TrustProxyEvaluator } from '../utils';
import { GlandMiddleware } from '../../types';
import { ProxyOptions } from '../../interface';
import { ConfigChannel } from '../../config/config.channel';

export class ProxyChannel extends AbstractPlugins<ProxyOptions, 'proxy'> {
  private trustEvaluator: TrustProxyEvaluator;
  private proxyTrustCount: number;
  private proxyIpHeader: string;
  private ipv4MappedPrefixes = ['::ffff:', '::ffff:0:'];

  constructor(channel: ConfigChannel) {
    super(channel, 'proxy');
    this.initializeProxySettings();
  }

  private initializeProxySettings(): void {
    const trustProxySetting = this.get('trustProxy');
    this.trustEvaluator = new TrustProxyEvaluator(normalizeTrustProxy(trustProxySetting));
    this.proxyTrustCount = this.get('proxyTrustCount') ?? 1;
    this.proxyIpHeader = this.get('proxyIpHeader')!;
  }

  createMiddleware(): GlandMiddleware {
    return (ctx, next) => {
      ctx.ip = this.getClientIp(ctx.req);
      ctx.ips = this.getProxiedIps(ctx.req);
      ctx.host = this.getHost(ctx.req);
      ctx.isSecure = ctx.protocol === 'https';

      next();
    };
  }

  private getHost(req: IncomingMessage): string | null {
    const remoteIp = req.socket.remoteAddress;
    const isTrusted = remoteIp && this.isTrustedProxy(remoteIp, 1);

    if (isTrusted) {
      const forwardedHost = req.headers['x-forwarded-host'];
      if (isString(forwardedHost)) {
        return forwardedHost.split(',')[0].trim();
      } else if (Array.isArray(forwardedHost)) {
        return forwardedHost[0];
      }
    }

    const host = req.headers.host || 'localhost';

    const portIndex = host.indexOf(':');
    return portIndex !== -1 ? host.substring(0, portIndex) : host;
  }

  private getClientIp(req: IncomingMessage): string {
    const ips = this.getProxiedIps(req);
    const remoteAddress = req.socket.remoteAddress;
    const clientIp = this.determineClientIp(ips, remoteAddress);

    return this.normalizeIp(clientIp);
  }

  private isTrustedProxy(ip: string, distance: number): boolean {
    return this.trustEvaluator.isTrusted(ip, distance);
  }

  private getProxiedIps(req: IncomingMessage): string[] {
    if (isUndefined(this.proxyIpHeader) || !req.headers[this.proxyIpHeader.toLowerCase()]) {
      return req.socket.remoteAddress ? [this.normalizeIp(req.socket.remoteAddress)] : [];
    }

    const header = req.headers[this.proxyIpHeader.toLowerCase()];

    let ips: string[] = [];

    if (isString(header)) {
      ips = header.split(',').map((ip) => ip.trim());
    } else if (Array.isArray(header)) {
      ips = header.flatMap((ip) => ip.split(',').map((i) => i.trim()));
    }
    return ips.map((ip) => this.normalizeIp(ip));
  }

  private determineClientIp(proxiedIps: string[], remoteAddress?: string): string {
    if (isUndefined(remoteAddress)) return '';

    const normalizedRemoteAddress = this.normalizeIp(remoteAddress);
    const allIps = [...proxiedIps, normalizedRemoteAddress];
    const trustedIps = this.getTrustedIps(allIps);

    if (!this.proxyTrustCount || isEmpty(trustedIps)) {
      return normalizedRemoteAddress;
    }

    const clientIpIndex = Math.min(trustedIps.length - 1, this.proxyTrustCount - 1);
    return trustedIps.length > 0 ? trustedIps[clientIpIndex] : normalizedRemoteAddress;
  }

  private getTrustedIps(ips: string[]): string[] {
    return ips.filter((ip, index) => this.isTrustedProxy(ip, ips.length - index));
  }

  private normalizeIp(ip: string = ''): string {
    if (ip === '::' || ip === '::1') {
      return '127.0.0.1';
    }

    for (const prefix of this.ipv4MappedPrefixes) {
      if (ip.startsWith(prefix)) {
        return ip.substring(prefix.length);
      }
    }

    return ip;
  }
}
