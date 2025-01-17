import { ServerRequest } from '../common/interfaces';

export function generateCacheKey(ctx: ServerRequest): string {
  return `${ctx.req.method}:${ctx.req.url}`;
}
export class RouteNormalizer {
  /**
   * Normalize a path by removing extra slashes and ensuring it starts with '/'.
   * @param path The raw path string to normalize.
   * @returns The normalized path string.
   */
  static normalizePath(path: string): string {
    if (!path) throw new Error('Path cannot be empty.');
    if (path === '/') return '/';
    return `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '');
  }

  /**
   * Combine a controller prefix with a route path.
   * @param prefix The controller prefix (e.g., '/api').
   * @param path The route path (e.g., '/foo').
   * @returns The combined and normalized full path.
   */
  static combinePaths(prefix: string | undefined, path: string): string {
    const normalizedPrefix = prefix ? this.normalizePath(prefix) : '';
    const normalizedPath = this.normalizePath(path);
    if (normalizedPath === '/') return normalizedPrefix + normalizedPath;
    return `${normalizedPrefix}${normalizedPath}`.replace(/\/+/g, '/');
  }

  /**
   * Validate that the decorator is applied to an instance method.
   * @param target The target object.
   * @param propertyKey The property name of the method.
   */
  static validateMethod(target: any, propertyKey: string | symbol): void {
    const isStatic = target.constructor.prototype[propertyKey] === undefined;
    if (isStatic) {
      throw new Error(`Decorators cannot be applied to static methods: ${String(propertyKey)}`);
    }
  }
}
/**
 * Route Validation Utility to ensure valid prefix
 */
export class RouteValidation {
  static isValidPath(path: string): boolean {
    // Check if path is non-empty, non-null, and of type string
    if (!path || typeof path !== 'string' || path.trim() === '') {
      return false;
    }

    // Ensure path doesn't contain invalid characters such as '{}' or "'"
    const invalidCharacters = /[{}'"]+/;
    if (invalidCharacters.test(path)) {
      return false;
    }

    return true;
  }
}
