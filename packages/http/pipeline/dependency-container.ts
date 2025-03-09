export class DependencyContainer {
  private dependencies: Map<string, any> = new Map();

  register<T>(key: string, value: T): void {
    this.dependencies.set(key, value);
  }

  resolve<T>(key: string): T {
    if (!this.dependencies.has(key)) {
      throw new Error(`Dependency '${key}' not registered`);
    }
    return this.dependencies.get(key) as T;
  }

  getAll(): Record<string, any> {
    return Object.fromEntries(this.dependencies.entries());
  }
}
