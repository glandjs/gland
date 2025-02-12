import { DefaultConfig } from './configs.defaults';
import { ApplicationOptions } from './interface';
import { isObject } from '@gland/common';
export class ApplicationConfig {
  private configStore: Map<keyof ApplicationOptions, any>;
  constructor() {
    this.configStore = new Map();
    this.initializeDefaults();
  }
  private initializeDefaults() {
    this.set('cors', DefaultConfig.getCorsConfig());
    this.set('cookies', DefaultConfig.getCookieConfig());
    this.set('proxy', DefaultConfig.getProxyConfig());
    this.set('settings', DefaultConfig.getSettingsConfig());
    this.set('views', DefaultConfig.getViewsConfig());
    this.set('https', DefaultConfig.getHttpsConfig());
    this.set('forceCloseConnections', false);
    this.set('json', { limit: '1mb', strict: true });
    this.set('urlencoded', { limit: '1mb' });
    this.set('rawBody', { limit: '1mb', encoding: null });
  }
  set<K extends keyof ApplicationOptions>(key: K, value: ApplicationOptions[K]): void {
    this.configStore.set(key, value);
  }

  get<K extends keyof ApplicationOptions>(key: K): ApplicationOptions[K] {
    return this.configStore.get(key);
  }
  merge<K extends keyof ApplicationOptions>(key: K, partialValue: Partial<ApplicationOptions[K]>): void {
    const current = this.get<K>(key);

    // If the value is an object, merge it; otherwise, just replace it
    if (isObject(current)) {
      this.set(key, { ...current, ...partialValue });
    } else {
      this.set(key, partialValue as ApplicationOptions[K]);
    }
  }
  public has<K extends keyof ApplicationOptions>(key: K): boolean {
    return this.configStore.has(key);
  }

  public delete<K extends keyof ApplicationOptions>(key: K): boolean {
    return this.configStore.delete(key);
  }

  public clear(): void {
    this.configStore.clear();
  }
}
