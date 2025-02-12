import { GLOBAL_METADATA } from '../constant';
import { SettingsConfig } from '../interface/config.interface';
import { Inject, Injectable } from '@gland/common';
/**
 * ConfigService provides access to application configuration values.
 * It ensures configurations are type-safe and evaluated at runtime.
 */
@Injectable()
export class SettingsService {
  constructor(@Inject(GLOBAL_METADATA.GLOBAL_WATERMARK) private readonly config?: SettingsConfig) {}
  public get settings(): SettingsConfig {
    return this.config!;
  }
  public get(key: keyof SettingsConfig): any {
    return this.config ? this.config[key as keyof SettingsConfig] : undefined;
  }
}
