import { TrustProxyOption } from '../types/config.types';

export class TrustProxyEvaluator {
  private readonly trust: TrustProxyOption;

  constructor(trustProxy: TrustProxyOption) {
    this.trust = trustProxy;
  }

  public isTrusted(ip: string, distance: number): boolean {
    if (typeof this.trust === 'boolean') {
      return this.trust; // Trust all or none
    }

    if (typeof this.trust === 'number') {
      return distance <= this.trust; // Trust N hops
    }

    if (typeof this.trust === 'string') {
      return this.matchesSpecialKeyword(ip) ?? this.matchesIpOrCidr(ip);
    }

    if (Array.isArray(this.trust)) {
      return this.trust.some((pattern) => this.matchesIpOrCidr(ip, pattern));
    }

    if (typeof this.trust === 'function') {
      return this.trust(ip, distance); // Custom trust function
    }

    return false; // Default: Do not trust
  }

  private matchesSpecialKeyword(ip: string): boolean {
    if (this.trust === 'loopback') {
      return ip === '127.0.0.1' || ip === '::1';
    }
    if (this.trust === 'linklocal') {
      return ip.startsWith('169.254.');
    }
    if (this.trust === 'uniquelocal') {
      return ip.startsWith('10.') || ip.startsWith('192.168.');
    }
    return false;
  }

  private matchesIpOrCidr(ip: string, pattern?: string): boolean {
    const targetPattern = pattern || (this.trust as string);
    if (targetPattern.includes('/')) {
      return this.isIpInCidrRange(ip, targetPattern);
    }
    return ip === targetPattern;
  }

  private isIpInCidrRange(ip: string, cidr: string): boolean {
    const [cidrIp, mask] = cidr.split('/');
    const maskBits = parseInt(mask, 10);
    const ipInt = this.ipToInt(ip);
    const cidrInt = this.ipToInt(cidrIp);
    const maskInt = ~((1 << (32 - maskBits)) - 1);
    return (ipInt & maskInt) === (cidrInt & maskInt);
  }

  private ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
  }
}
