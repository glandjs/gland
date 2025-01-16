import { RouterMetadataKeys } from '../common/enums';
import Reflector from '../metadata';
import { RouteNormalizer, RouteValidation } from '../utils';
/**
 * A decorator to define a controller with a route prefix.
 * It combines the provided prefix with any existing controller prefix and ensures the final prefix is normalized.
 * The decorator stores the full normalized prefix in the metadata for later use.
 *
 * @param prefix The prefix to be applied to the controller's route. It will be normalized.
 * @returns A class decorator that defines the controller's route prefix.
 *
 * @example
 * // Example of usage
 * @Controller('/api')
 * class ApiController {
 *   // This controller will have a base route of '/api'
 * }
 *
 * @example
 * // Example with combined prefix
 * @Controller('/api')
 * @Controller('/v1')
 * class VersionedApiController {
 *   // This controller will have a base route of '/api/v1'
 * }
 */
export function Controller(prefix: string): ClassDecorator {
  return (target) => {
    // Validate prefix using RouteValidation
    if (!RouteValidation.isValidPath(prefix)) {
      throw new Error(`Invalid route prefix: "${prefix}". Prefix cannot be empty or contain invalid characters.`);
    }
    const existingPrefix = Reflector.get(RouterMetadataKeys.CONTROLLER_PREFIX, target);
    let fullPrefix = RouteNormalizer.normalizePath(prefix);
    if (existingPrefix) {
      fullPrefix = RouteNormalizer.combinePaths(existingPrefix, prefix);
    }
    Reflector.define(RouterMetadataKeys.CONTROLLER_PREFIX, fullPrefix, target);
  };
}
