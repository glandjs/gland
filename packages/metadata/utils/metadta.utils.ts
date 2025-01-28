import { isClass } from '@gland/common';
import { MetadataKey, MetadataParameterIndex, MetadataTarget } from '../types/metadata.types';
export const MetadataScope = {
  CLASS: 'class',
  METHOD: 'method',
  PROPERTY: 'property',
  PARAMETER: 'param',
} as const;
export type MetadataScopeType = keyof typeof MetadataScope;

/**
 * Construct a fully qualified metadata key.
 */
export function constructKey(metadataKey: MetadataKey, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): MetadataKey {
  let key = String(metadataKey);
  if (typeof parameterIndex === 'number') {
    key = `${MetadataScope.PARAMETER}:${parameterIndex}:${key}`;
  }
  if (typeof propertyKey !== 'undefined') {
    if (typeof parameterIndex === 'undefined') {
      key = `${MetadataScope.METHOD}:${String(propertyKey)}:${key}`; // This is used for method metadata
    } else {
      key = `${MetadataScope.PROPERTY}:${String(propertyKey)}:${key}`; // Correct prefix for property metadata
    }
  }

  if (typeof propertyKey === 'undefined' && !parameterIndex) {
    key = `${MetadataScope.CLASS}:${key}`;
  }
  return key;
}
/**
 * Resolves the target to its class constructor.
 * If the target is a class, it is returned as-is.
 * If the target is an instance, its constructor is returned.
 *
 * @param target - The target to resolve (class or instance).
 * @returns The resolved class constructor.
 */
export function resolveTargetClass(target: MetadataTarget): MetadataTarget | null {
  return isClass(target) ? target : target.constructor;
}
