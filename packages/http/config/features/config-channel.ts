import { Logger, merge } from '@medishn/toolkit';
import { ConfigChannel } from '..';
import { GlandMiddleware, HttpApplicationOptions } from '../../interface';

export abstract class AbstractConfigChannel<X, T extends keyof HttpApplicationOptions> {
  protected logger: Logger;
  constructor(protected channel: ConfigChannel, protected configKey: T) {
    this.logger = new Logger({ context: `HTTP:${this.configKey.toUpperCase()}` });
    this.bindEventHandlers();
  }

  public abstract createMiddleware(): GlandMiddleware;

  private bindEventHandlers(): void {
    this.channel.onChange(({ key, value }) => {
      if (key === this.configKey) {
        this.update(value as any);
      }
    });
  }
  get values(): HttpApplicationOptions[T] {
    return this.channel.get(this.configKey);
  }

  public get<K extends keyof X>(key: K): X[K] {
    const obj = this.channel.get(this.configKey)! as any;
    return this.channel.getNested(obj).get(key);
  }

  public set<K extends keyof X>(key: K, value: X[K]): void {
    this.update({ [key]: value } as any);
  }

  private update<K extends keyof X>(options: K): void {
    this.channel.update({ [this.configKey]: options });
  }

  public updateMany(options: Partial<X>): void {
    if (!options || Object.keys(options).length === 0) {
      return;
    }

    const currentConfig = this.channel.get(this.configKey)!;
    const newConfig = merge(currentConfig, options).value;

    this.channel.set(this.configKey, newConfig);
  }
}
