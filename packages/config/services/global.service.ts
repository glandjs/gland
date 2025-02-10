import { GLOBAL_METADATA } from '../constant';
import { GlobalSettings } from '../interface/config.interface';
import { Environment, Inject, Injectable } from '@gland/common';
/**
 * ConfigService provides access to application configuration values.
 * It ensures configurations are type-safe and evaluated at runtime.
 */
@Injectable()
export class ConfigService {
  constructor(@Inject(GLOBAL_METADATA.GLOBAL_WATERMARK) private readonly config?: GlobalSettings) {
    this.config = this.defaultGlobalSettings(config);
  }
  public get global(): GlobalSettings {
    return this.config!;
  }
  public get(key: keyof GlobalSettings): any {
    return this.config ? this.config[key as keyof GlobalSettings] : undefined;
  }
  private defaultGlobalSettings(config?: GlobalSettings): GlobalSettings {
    return {
      env: config?.env ?? Environment.DEVELOPMENT,
      etag: config?.etag ?? 'strong',
      poweredBy: config?.poweredBy ?? 'Gland',
    };
  }
}
