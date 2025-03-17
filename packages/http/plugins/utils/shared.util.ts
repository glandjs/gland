import { TrustProxyOption } from '../../types/app-options.types';
import { isArray, isFunction, isNumber, isString } from '@medishn/toolkit';
export const TRUST_PROXY_DEFAULT_SYMBOL = 'trustproxy.default';
export function normalizeTrustProxy(trustProxy?: TrustProxyOption): TrustProxyOption {
  if (trustProxy === true || trustProxy === false) {
    return trustProxy;
  }

  if (isString(trustProxy)) {
    const lower = trustProxy.toLowerCase();
    if (['loopback', 'linklocal', 'uniquelocal'].includes(lower)) {
      return lower;
    }
    if (isValidIpOrCidr(trustProxy)) {
      return trustProxy;
    }
  }

  if (isArray(trustProxy) && trustProxy.every(isValidIpOrCidr)) {
    return trustProxy;
  }
  if (isNumber(trustProxy) && trustProxy >= 0) {
    return trustProxy;
  }

  if (isFunction(trustProxy)) {
    return trustProxy;
  }
  return TRUST_PROXY_DEFAULT_SYMBOL;
}
function isValidIpOrCidr(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(\/\d{1,3})?$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
