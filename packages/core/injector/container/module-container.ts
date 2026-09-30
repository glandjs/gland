import type { ModuleRef } from '../module';

/**
 * Every module registered in an application, keyed by token.
 *
 * Extends `Map` so lookups stay O(1) — the previous implementation scanned
 * `values()` linearly even though the map was already keyed by token.
 */
export class ModulesContainer extends Map<string, ModuleRef> {
  /**
   * Looks a module up by token.
   *
   * @param token - the module's identifier (its class name)
   * @returns the module, or `undefined` when it was never registered
   */
  public getByToken(token: string): ModuleRef | undefined {
    return this.get(token);
  }

  /**
   * Walks the whole module tree, depth-first, starting at `root`.
   *
   * Uses the `imports` edges, so a module reached through two different
   * parents is yielded once.
   *
   * @param root - entry point; defaults to every registered module
   */
  public traverse(root?: ModuleRef): ModuleRef[] {
    const seen = new Set<ModuleRef>();
    const order: ModuleRef[] = [];

    const visit = (moduleRef: ModuleRef): void => {
      if (seen.has(moduleRef)) return;
      seen.add(moduleRef);
      order.push(moduleRef);
      for (const imported of moduleRef.imports) {
        visit(imported);
      }
    };

    if (root) {
      visit(root);
    } else {
      for (const moduleRef of this.values()) {
        visit(moduleRef);
      }
    }

    return order;
  }
}
