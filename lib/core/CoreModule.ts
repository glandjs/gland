import { AppConfig } from '../common/interface/app-settings.interface';
import { AppSettings } from '../common/settings';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { RouterManager } from '../router/RouterManager';
import { Glogger } from '../utils/Logger';
export class CoreModule {
  private readonly loggerManager: Glogger;
  private readonly routerManager: RouterManager;
  private readonly middlewareManager: MiddlewareManager;
  private readonly settings: AppSettings;
  constructor(config: Partial<AppConfig> = {}) {
    this.settings = new AppSettings(config);
    this.loggerManager = new Glogger();
    this.routerManager = new RouterManager(this.settings.getPaths().apiPrefix!);
    this.middlewareManager = new MiddlewareManager();
  }

  /** Access the logger instance */
  get logger(): Glogger {
    return this.loggerManager;
  }

  /** Access the middleware module */
  get middleware(): MiddlewareManager {
    return this.middlewareManager;
  }

  /** Access the router module */
  get router(): RouterManager {
    return this.routerManager;
  }

  /** Access the app settings */
  get config(): AppSettings {
    return this.settings;
  }
}
