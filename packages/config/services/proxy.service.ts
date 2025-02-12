import { Inject, Injectable, isEmpty, isUndefined } from '@gland/common';
import { PROXY_METADATA } from '../constant';
import { normalizeTrustProxy, TrustProxyEvaluator } from '../utils';
import { IncomingMessage } from 'http';
import { ProxyOptions } from '../interface';

@Injectable()
export class ProxyService {
  private readonly trustEvaluator: TrustProxyEvaluator;
  private readonly proxyTrustCount?: number;
  private readonly proxyIpHeader?: string;

  constructor(
    @Inject(PROXY_METADATA.PROXY_WATERMARK)
    config: ProxyOptions = {},
  ) {
    this.trustEvaluator = new TrustProxyEvaluator(normalizeTrustProxy(config.trustProxy));
    this.proxyTrustCount = config.proxyTrustCount;
    this.proxyIpHeader = config.proxyIpHeader;
  }

  public getClientIp(req: IncomingMessage): string {
    const ips = this.getProxiedIps(req);
    return this.determineClientIp(ips, req.socket.remoteAddress);
  }

  private getProxiedIps(req: IncomingMessage): string[] {
    if (isUndefined(this.proxyIpHeader)) return [];
    const header = req.headers[this.proxyIpHeader.toLowerCase()];
    return typeof header === 'string' ? header.split(/\s*,\s*/).reverse() : [];
  }

  private determineClientIp(proxiedIps: string[], remoteAddress?: string): string {
    if (isUndefined(remoteAddress)) return '';

    const allIps = [...proxiedIps, remoteAddress];
    const trustedIps = this.getTrustedIps(allIps);
    if (isUndefined(this.proxyTrustCount) || isEmpty(trustedIps)) {
      return remoteAddress;
    }
    return trustedIps.length > 0 && this.proxyTrustCount > 0 ? trustedIps[Math.min(trustedIps.length - 1, this.proxyTrustCount - 1)] : remoteAddress;
  }

  private getTrustedIps(ips: string[]): string[] {
    return ips.filter((ip, index) => this.isTrustedProxy(ip, ips.length - index));
  }

  public isTrustedProxy(ip: string, distance: number): boolean {
    return this.trustEvaluator.isTrusted(ip, distance);
  }
}
