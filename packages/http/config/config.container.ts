import { inspect, isObject, Logger, merge } from '@medishn/toolkit';
import { HttpApplicationOptions } from '../interface';
import { ConfigChannel } from './config.channel';
import { ApplicationConfigurationDefaults } from './config-defaults';
import { ObjectInspector } from '@medishn/toolkit/dist/object';

export class ConfigContainer {
  private store: Map<keyof HttpApplicationOptions, any> = new Map();

  constructor(private _channel: ConfigChannel) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this._channel.onGet((key) => {
      return this.get(key);
    });

    this._channel.onSet(({ key, value }) => {
      this.set(key, value);
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

  private clear(): void {
    this.store.clear();
  }

  private getNested<T extends object = object>(obj: T): ObjectInspector<T> {
    return inspect(obj);
  }
}
