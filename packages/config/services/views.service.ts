import { Inject, Injectable } from '@gland/common';
import { VIEWS_METADATA } from '../constant';
import { ViewsConfig } from '../types/config.types';
import { IConfigEngines } from '../interface/config.interface';
/**
 * @service ViewsService
 * This service handles the configuration and setup of the views system.
 * It ensures that the correct templates engine is used and that the views are
 * rendered correctly according to the defined options.
 */
@Injectable()
export class ViewsService {
  constructor(@Inject(VIEWS_METADATA.VIEWS_WATERMARK) private readonly options: ViewsConfig) {
    this.options = options ?? this.getDefaultViewsConfig();
  }

  private getDefaultViewsConfig(): ViewsConfig {
    return {
      directory: 'views',
      engine: {
        engine: 'ejs',
        cacheTemplates: true,
      },
    };
  }

  public getEngineConfig(): IConfigEngines {
    return this.options.engine!;
  }

  public getViewDirectories(): string[] {
    return Array.isArray(this.options.directory) ? this.options.directory : [this.options.directory];
  }
}
