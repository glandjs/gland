import type { TrustProxyOption } from '@glandjs/http/types';
import { isArray, isBoolean, isFunction, isNumber, isString } from '@medishn/toolkit';

export class TrustProxyEvaluator {
  private readonly trust: TrustProxyOption;

  constructor(trustProxy: TrustProxyOption) {
    this.trust = trustProxy;
  }

  public isTrusted(ip: string, distance: number): boolean {
    if (isBoolean(this.trust)) {
      return this.trust; // Trust all or none
    }

    if (isNumber(this.trust)) {
      return distance <= this.trust; // Trust N hops
    }

    if (isString(this.trust)) {
      return this.matchesSpecialKeyword(ip) ?? this.matchesIpOrCidr(ip);
    }

    if (isArray(this.trust)) {
      return this.trust.some((pattern) => this.matchesIpOrCidr(ip, pattern));
    }

    if (isFunction(this.trust)) {
      return this.trust(ip, distance);
    }

    return false;
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
