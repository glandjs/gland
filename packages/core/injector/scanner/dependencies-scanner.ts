import type { ImportableModule } from '@glandjs/common';
import type { Constructor, Logger } from '@medishn/toolkit';
import { Container } from '../container';
import type { ModuleRef } from '../module';

/**
 * Entry point for turning a root module into a populated {@link Container}.
 *
 * A deliberately thin facade: {@link Container.register} already walks the
 * import graph transitively, so a second scanning pass over the module tree
 * could only ever repeat that work. This type exists to give callers a
 * name that says "bootstrap the module graph" and to hold the logger.
 */
export class DependenciesScanner {
  /** The container holding every registered module and provider. */
  public readonly container: Container;

  private readonly logger?: Logger;

  constructor(logger?: Logger) {
    this.container = new Container(logger);
    this.logger = logger?.child('Scanner');
  }

  /**
   * Registers `rootModule` and everything it transitively imports.
   *
   * @param rootModule - the application's entry module
   * @returns the registered root, for callers that need its instance
   *
   * @throws {CircularDependencyError} if the import graph contains a cycle
   */
  public async scan<T>(rootModule: Constructor<T> | ImportableModule<T>): Promise<ModuleRef<T>> {
    this.logger?.debug(`Scanning module graph from "${this.nameOf(rootModule)}"`);

    const rootRef = await this.container.register(rootModule);

    this.logger?.debug(`Scanned ${this.container.moduleContainer.size} module(s)`);
    this.logger?.debug('- Done.');
    return rootRef;
  }

  /** Every module registered by the last {@link scan}. */
  public get modules() {
    return this.container.moduleContainer;
  }

  /** Best-effort name for logging, tolerating promise-shaped imports. */
  private nameOf(module: Constructor | ImportableModule): string {
    if (module instanceof Promise) return '<lazy import>';
    if (typeof module === 'function') return module.name || 'anonymous';
    const dynamic = module as { module?: Constructor };
    return dynamic?.module?.name ?? 'dynamic';
  }
}
