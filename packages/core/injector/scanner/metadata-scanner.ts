export class MetadataScanner {
  scanFromPrototype<R>(prototype: object, handler: (methodName: string) => R): R[] {
    const methodNames = this.getAllFilteredMethodNames(prototype);
    return methodNames.map(handler);
  }
  getAllFilteredMethodNames(prototype: object): string[] {
    const methodNames = Object.getOwnPropertyNames(prototype);
    return methodNames.filter((method) => {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, method);
      return descriptor && typeof descriptor.value === 'function' && method !== 'constructor';
    });
  }
}
