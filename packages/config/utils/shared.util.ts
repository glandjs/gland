import { TRUST_PROXY_DEFAULT_SYMBOL } from '../constant';
import { TrustProxyOption } from '../types/config.types';

export function normalizeTrustProxy(trustProxy?: TrustProxyOption): TrustProxyOption {
  if (trustProxy === true || trustProxy === false) {
    return trustProxy;
  }

  if (typeof trustProxy === 'string') {
    const lower = trustProxy.toLowerCase();
    if (['loopback', 'linklocal', 'uniquelocal'].includes(lower)) {
      return lower;
    }
    if (isValidIpOrCidr(trustProxy)) {
      return trustProxy;
    }
  }

  if (Array.isArray(trustProxy) && trustProxy.every(isValidIpOrCidr)) {
    return trustProxy;
  }
  if (typeof trustProxy === 'number' && trustProxy >= 0) {
    return trustProxy;
  }

  if (typeof trustProxy === 'function') {
    return trustProxy;
  }
  return TRUST_PROXY_DEFAULT_SYMBOL;
}
function isValidIpOrCidr(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(\/\d{1,3})?$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
