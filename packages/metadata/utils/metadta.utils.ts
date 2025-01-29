import { decode, encode, isClass } from '@gland/common';
import { MetadataKey, MetadataParameterIndex, MetadataTarget, MetadataValue, TargetIdentification } from '../types/metadata.types';
import { KEY_SEPARATOR, MetadataScope, PREFIX } from '../constant';

/**
 * Construct a fully qualified metadata key.
 */
export function constructMetadataKey(metadataKey: MetadataKey, metadataTarget: TargetIdentification, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): MetadataKey {
  let encodedKey = encode(metadataKey);
  const encodedPropertyKey = propertyKey ? (typeof propertyKey === 'symbol' ? `${propertyKey.description}` : encode(propertyKey)) : undefined;
  let keyParts: string[] = [PREFIX];
  if (!propertyKey && parameterIndex !== undefined) {
    keyParts.push(`${MetadataScope.PARAMETER}=${parameterIndex}`, `KEY=${encodedKey}`);
  } else if (propertyKey) {
    if (parameterIndex !== undefined) {
      keyParts.push(`${MetadataScope.PROPERTY}=${encodedPropertyKey}`, `${MetadataScope.PARAMETER}=${parameterIndex}`, `KEY=${encodedKey}`);
    } else {
      keyParts.push(`${MetadataScope.METHOD}=${encodedPropertyKey}`, `KEY=${encodedKey}`);
    }
  } else {
    if (metadataTarget.type === 'function') {
      keyParts.push(`${MetadataScope.FUNCTION}`, `KEY=${encodedKey}`);
    } else {
      keyParts.push(`${MetadataScope.CLASS}`, `KEY=${encodedKey}`);
    }
  }
  return keyParts.join(KEY_SEPARATOR);
}

export function identifyTargetType(target: MetadataTarget): TargetIdentification {
  if (isClass(target)) {
    return { type: 'class', target };
  }
  if (target && typeof target === 'object' && target.constructor && isClass(target.constructor)) {
    const isPrototype = Object.getPrototypeOf(target) === target.constructor.prototype;
    if (isPrototype) {
      return { type: 'class', target: target.constructor }; // Prototype case
    } else {
      return { type: 'object', target }; // Instance case
    }
  }
  if (typeof target === 'function') {
    if (target.prototype && Object.getPrototypeOf(target) !== Object.prototype) {
      return { type: 'method', target };
    }
    return { type: 'function', target };
  } else if (typeof target === 'object') {
    return { type: 'object', target };
  }

  return { type: 'unknown', target };
}
export function parseMetadataEntries<K, V>(entries: [MetadataKey<K>, MetadataValue<V>][]) {
  return entries.map(([key, value]) => {
    const parsedEntry: {
      scopes?: string[];
      propertyValue?: string;
      parameterIndex?: MetadataParameterIndex;
      metadataKey?: MetadataKey<K>;
      metadataValue?: MetadataValue<V>;
    } = {};
    const [metadataScope, metadataKey] = typeof key === 'string' || typeof key === 'symbol' ? key.toString().replace('meta::', '').split('KEY=') : ['', ''];
    const scopeParts = metadataScope.split('::').filter(Boolean);

    const scopes: string[] = [];
    let propertyValue: string | undefined;
    let parameterIndex: number | undefined;

    scopeParts.forEach((part) => {
      if (part.includes('=')) {
        const [scope, scopeValue] = part.split('=');
        scopes.push(scope.toUpperCase());
        if (scope === 'property') {
          propertyValue = scopeValue;
        } else if (scope === 'param') {
          parameterIndex = Number(scopeValue);
        }
      } else {
        scopes.push(part.toUpperCase());
      }
    });

    parsedEntry.scopes = scopes;
    parsedEntry.metadataKey = decode(metadataKey) as MetadataKey<K>;
    parsedEntry.metadataValue = value;
    if (propertyValue) parsedEntry.propertyValue = propertyValue;
    if (parameterIndex) parsedEntry.parameterIndex = parameterIndex;

    return parsedEntry;
  });
}
