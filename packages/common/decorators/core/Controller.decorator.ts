import Reflector from '@gland/metadata';
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
    if (!RouteValidation.isValidPath(prefix)) {
      throw new Error(`Invalid route prefix: "${prefix}". Prefix cannot be empty or contain invalid characters.`);
    }
    const existingPrefix = Reflector.getMetadata(ROUTER_METADATA.CONTROLLER_PREFIX_METADATA, target);
    let fullPrefix = RouteNormalizer.normalizePath(prefix);
    if (existingPrefix) {
      fullPrefix = RouteNormalizer.combinePaths(existingPrefix, prefix);
    }
    const routes: RouteDefinition[] = Reflector.getMetadata(ROUTER_METADATA.ROUTES_METADATA, target) ?? [];
    routes.forEach((route) => {
      route.path = RouteNormalizer.combinePaths(fullPrefix, route.path);
    });
    Reflector.defineMetadata(ROUTER_METADATA.CONTROLLER_PREFIX_METADATA, fullPrefix, target);
  };
}
