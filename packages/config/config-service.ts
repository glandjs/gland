import { defaultConfig } from './config.default';
import { ConfigOptions, IConfigCore, IConfigSettings } from './interface/config.interface';
import { TrustProxyEvaluator } from './utils';
import { Injectable } from '@gland/common';
/**
 * ConfigService provides access to application configuration values.
 * It ensures configurations are type-safe and evaluated at runtime.
 */
@Injectable()
export class ConfigService {
  private readonly _settings: ConfigOptions['settings'];
  private readonly _core: ConfigOptions['core'];
  private readonly trustProxyEvaluator: TrustProxyEvaluator;

  constructor(config?: ConfigOptions) {
    const { core, settings } = defaultConfig(config ?? {});
    this._core = core;
    this._settings = settings;
    this.trustProxyEvaluator = new TrustProxyEvaluator(this._core!.trustProxy!);
  }
  public get core(): ConfigOptions['core'] {
    return this._core;
  }

  public get settings(): ConfigOptions['settings'] {
    return this._settings;
  }

  public get proxyEvaluator(): TrustProxyEvaluator {
    return this.trustProxyEvaluator;
  }
  public get(key: keyof IConfigCore | keyof IConfigSettings): any {
    if (this._core && key in this._core && this._core[key as keyof IConfigCore] !== undefined) {
      return this._core[key as keyof IConfigCore];
    }
    return this._settings ? this._settings[key as keyof IConfigSettings] : undefined;
  }
}
