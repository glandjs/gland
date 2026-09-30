/**
 * Reflects over a class prototype to enumerate its real methods.
 *
 * Deliberately shallow: it reports the own property names of the prototype it
 * is handed. Inherited handlers are not picked up, so a base controller
 * declaring routes only binds them on the class that declares them.
 */
export class MetadataScanner {
  /**
   * Invokes `handler` once per method defined directly on `prototype`.
   *
   * @param prototype - the prototype to inspect, e.g. `Object.getPrototypeOf(instance)`
   * @param handler - receives each method name; its result is collected
   * @returns whatever `handler` returned, in declaration order
   */
  public scanFromPrototype<R>(prototype: object, handler: (methodName: string) => R): R[] {
    return this.getAllFilteredMethodNames(prototype).map(handler);
  }

  /**
   * Lists the method names defined directly on `prototype`.
   *
   * Excludes `constructor` and any accessor (getter/setter), since only plain
   * methods can carry route or event metadata.
   */
  public getAllFilteredMethodNames(prototype: object): string[] {
    return Object.getOwnPropertyNames(prototype).filter((name) => {
      if (name === 'constructor') return false;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      return !!descriptor && typeof descriptor.value === 'function';
    });
  }
}
