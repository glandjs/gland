/**
 * @internal
 * Thrown when an optional peer dependency is missing.
 */
export class MissingDependencyError extends Error {
  constructor(
    public readonly packageName: string,
    reason: string,
  ) {
    super(`The "${packageName}" package is missing. Install it to take advantage of ${reason}.`);
    this.name = 'MissingDependencyError';
  }
}

/**
 * Requires a package at runtime, with a readable failure when it is absent.
 *
 * Previously this called `process.exit(1)` on failure, which made the helper
 * unusable in servers that need to degrade gracefully and impossible to test.
 * It now throws {@link MissingDependencyError} so the caller decides.
 *
 * @param packageName - module specifier to require
 * @param reason - human explanation of what the package unlocks
 * @param loaderFn - override the resolution mechanism (used by tests/bundlers)
 *
 * @throws {MissingDependencyError} when the package cannot be resolved
 *
 * @example
 * const cors = loadPackage('cors', 'CORS support');
 */
export function loadPackage<T = unknown>(packageName: string, reason: string, loaderFn?: () => T): T {
  try {
    return loaderFn ? loaderFn() : (require(packageName) as T);
  } catch {
    throw new MissingDependencyError(packageName, reason);
  }
}
