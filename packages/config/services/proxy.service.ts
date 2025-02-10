import { Inject, Injectable } from '@gland/common';
import { PROXY_METADATA } from '../constant';
import { ProxyServiceConfig } from '../interface/config.interface';
import { normalizeTrustProxy, TrustProxyEvaluator } from '../utils';
import { IncomingMessage } from 'http';

@Injectable()
export class ProxyService {
  private readonly trustEvaluator: TrustProxyEvaluator;
  private readonly proxyTrustCount: number;
  private readonly proxyIpHeader: string;

  constructor(
    @Inject(PROXY_METADATA.PROXY_WATERMARK)
    private readonly config: ProxyServiceConfig = {},
  ) {
    const normalizedConfig = this.normalizeConfig(config);
    this.trustEvaluator = new TrustProxyEvaluator(normalizedConfig.trustProxy);
    this.proxyTrustCount = normalizedConfig.proxyTrustCount ?? 0;
    this.proxyIpHeader = normalizedConfig.proxyIpHeader ?? 'x-forwarded-for';
  }

  private normalizeConfig(config: ProxyServiceConfig): Required<ProxyServiceConfig> {
    return {
      trustProxy: normalizeTrustProxy(config.trustProxy),
      proxyTrustCount: config.proxyTrustCount ?? 0,
      proxyIpHeader: config.proxyIpHeader ?? 'x-forwarded-for',
    };
  }

  public getClientIp(req: IncomingMessage): string {
    const ips = this.getProxiedIps(req);
    return this.determineClientIp(ips, req.socket.remoteAddress!);
  }

  private getProxiedIps(req: IncomingMessage): string[] {
    const header = req.headers[this.proxyIpHeader.toLowerCase()];
    return typeof header === 'string' ? header.split(/\s*,\s*/).reverse() : [];
  }

  private determineClientIp(proxiedIps: string[], remoteAddress: string): string {
    const allIps = [...proxiedIps, remoteAddress];
    const trustedIps = this.getTrustedIps(allIps);

    return trustedIps.length > 0 && this.proxyTrustCount > 0 ? trustedIps[Math.min(trustedIps.length - 1, this.proxyTrustCount - 1)] : remoteAddress;
  }

  private getTrustedIps(ips: string[]): string[] {
    return ips.filter((ip, index) => this.isTrustedProxy(ip, ips.length - index));
  }

  public isTrustedProxy(ip: string, distance: number): boolean {
    return this.trustEvaluator.isTrusted(ip, distance);
  }
}
