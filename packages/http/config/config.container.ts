import { inspect, isObject, Logger, merge } from '@medishn/toolkit';
import { HttpApplicationOptions } from '../interface';
import { ConfigChannel } from './config.channel';
import { ApplicationConfigurationDefaults } from './config-defaults';
import { ObjectInspector } from '@medishn/toolkit/dist/object';

export class ConfigContainer {
  private store: Map<keyof HttpApplicationOptions, any> = new Map();
  private logger = new Logger({ context: 'HTTP:ConfigContainer' });

  constructor(private _channel: ConfigChannel) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this._channel.onGet((key) => {
      return this.get(key);
    });

    this._channel.onGetAll(() => {
      return this.getAll();
    });

    this._channel.onHas((key) => {
      return this.has(key);
    });

    this._channel.onSet(({ key, value }) => {
      this.set(key, value);
    });

    this._channel.onDelete((key) => {
      this.delete(key);
    });

    this._channel.onClear(() => {
      this.clear();
    });

    this._channel.onInitialize((options) => {
      this.initializeDefaults(options);
    });

    this._channel.onUpdate((options) => {
      this.update(options);
    });
    this._channel.onGetNested((obj) => {
      return this.getNested(obj);
    });
  }

  private initializeDefaults(options?: HttpApplicationOptions) {
    this.logger.debug('Initializing config defaults');
    const defaults = ApplicationConfigurationDefaults;
    this.set('body', defaults.bodyParser);
    this.set('cookies', defaults.cookie);
    this.set('cors', defaults.cors);
    this.set('https', undefined);
    this.set('proxy', defaults.proxy);
    this.set('settings', defaults.settings);
    this.set('shutdown', defaults.shutdown);
    this.set('views', defaults.views);

    if (options) {
      for (const key in options) {
        if (options.hasOwnProperty(key)) {
          this.set(key as keyof HttpApplicationOptions, options[key]);
        }
      }
    }
  }

  private get<K extends keyof HttpApplicationOptions>(key: K): HttpApplicationOptions[K] {
    return this.store.get(key);
  }

  private getAll(): HttpApplicationOptions {
    const config: Partial<HttpApplicationOptions> = {};
    for (const [key, value] of this.store.entries()) {
      config[key] = value;
    }
    return config as HttpApplicationOptions;
  }

  private set<K extends keyof HttpApplicationOptions>(key: K, value: Partial<HttpApplicationOptions[K]>): void {
    const current = this.get(key);
    if (isObject(current)) {
      this.store.set(key, merge(current, value).value);
    } else {
      this.store.set(key, value);
    }
  }

  private update(options: Partial<HttpApplicationOptions>): void {
    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        this.set(key as keyof HttpApplicationOptions, options[key]);
      }
    }
  }

  private has<K extends keyof HttpApplicationOptions>(key: K): boolean {
    return this.store.has(key);
  }

  private delete<K extends keyof HttpApplicationOptions>(key: K): boolean {
    return this.store.delete(key);
  }

  private clear(): void {
    this.store.clear();
  }

  private getNested<T extends object = object>(obj: T): ObjectInspector<T> {
    return inspect(obj);
  }
}
