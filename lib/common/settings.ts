import { AppConfig, CacheItem, Engine, KEY_SETTINGS, PathConfig } from '../common/interface/app-settings.interface';
import { QiksCache } from '../utils/Cache';
import { defaultConfig } from './config';
export class AppSettings {
  private readonly _settings: AppConfig;
  private readonly _engines: Record<string, Engine> = Object.create(null);
  private readonly _cache: QiksCache<string, CacheItem> = new QiksCache();
  constructor(config: Partial<AppConfig> = {}) {
    this._settings = { ...defaultConfig, ...config };
  }
  /** Register or update a setting */
  setSetting<T extends keyof AppConfig>(key: T, value: AppConfig[T]): void {
    this._settings[key] = value;
  }

  /** Retrieve a specific setting */
  getSetting<T extends keyof AppConfig>(key: T): AppConfig[T] {
    return this._settings[key];
  }

  /** Retrieve all settings */
  getAllSettings(): AppConfig {
    return { ...this._settings };
  }

  /** Check if a specific setting exists */
  hasSetting<T extends keyof AppConfig>(key: T): boolean {
    return this._settings[key] !== undefined;
  }

  /** Register an engine */
  registerEngine(name: string, engine: Engine): void {
    if (!engine || typeof engine.initialize !== 'function') {
      throw new Error(`Invalid engine: ${name}`);
    }
    this._engines[name] = engine;
    engine.initialize();
  }

  /** Get a registered engine */
  getEngine(name: string): Engine | undefined {
    return this._engines[name];
  }

  /** Add a cache item */
  setCache(key: string, value: CacheItem): void {
    if (!value || typeof value.createdAt !== 'number' || typeof value.watch !== 'boolean') {
      throw new Error('Invalid cache item');
    }
    this._cache.set(key, value);
  }

  /** Retrieve a cache item */
  getCache(key: string): CacheItem | string[] | [string, CacheItem][] | CacheItem[] | Promise<CacheItem | null> | null {
    return this._cache.get(key);
  }

  getPaths(): PathConfig {
    return this._settings[KEY_SETTINGS.PATHS] || {};
  }
}
