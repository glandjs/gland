import { AppConfig, KEY_SETTINGS, PathConfig } from '../common/interface/app-settings.interface';
import { defaultConfig } from './config';
export class AppSettings {
  private readonly _settings: AppConfig;
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

  getPaths(): PathConfig {
    return this._settings[KEY_SETTINGS.PATHS] || {};
  }
}
