import { RouteDefinition } from '../router/Roter.interface';
import { QiksCache } from '../utils/Cache';

export class AppSettings {
  protected _settings: Record<string, any> = Object.create(null);
  protected _engines: Record<string, any> = Object.create(null);
  protected _cache: Record<string, any> = Object.create(null);
  protected _routes: QiksCache<string, RouteDefinition> = new QiksCache();
  // Register a global setting
  setSetting(key: string, value: any): void {
    this._settings[key] = value;
  }

  // Get a global setting
  getSetting(key: string): any {
    return this._settings[key];
  }

  // Register an engine
  setEngine(name: string, engine: any): void {
    this._engines[name] = engine;
  }

  // Retrieve an engine
  getEngine(name: string): any {
    return this._engines[name];
  }

  // Cache data
  cacheData(key: string, value: any): void {
    this._cache[key] = value;
  }

  // Retrieve cached data
  getCache(key: string): any {
    return this._cache[key];
  }
}
