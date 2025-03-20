import { Logger, merge } from '@medishn/toolkit';
import { ConfigChannel } from '../config';
import { GlandMiddleware, HttpApplicationOptions } from '../interface';

export abstract class AbstractPlugins<X, T extends keyof HttpApplicationOptions> {
  protected logger: Logger;
  constructor(
    protected channel: ConfigChannel,
    protected configKey: T,
  ) {
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
    const obj = this.channel.get(this.configKey) as any;
    const nested = this.channel.getNested(obj);
    return nested.get(key);
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
