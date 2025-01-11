import { AppConfig, GlobalCache, KEY_SETTINGS } from '../common/interface/app-settings.interface';
import { AppSettings } from '../common/settings';
import { EventSystemManager } from '../events/EventSystemManager';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { RouterManager } from '../router/RouterManager';
import { MemoryCacheStore } from '../utils/Cache';
import { Glogger } from '../utils/Logger';
export class CoreModule {
  private readonly loggerManager: Glogger;
  private readonly routerManager: RouterManager;
  private readonly middlewareManager: MiddlewareManager;
  private readonly cacheSystemManager: GlobalCache;
  private readonly settings: AppSettings;
  private readonly eventsManager: EventSystemManager;
  constructor(config: Partial<AppConfig> = {}) {
    this.settings = new AppSettings(config);
    this.loggerManager = new Glogger();
    this.middlewareManager = new MiddlewareManager();
    this.cacheSystemManager = new MemoryCacheStore(config?.[KEY_SETTINGS.CACHE]);
    this.eventsManager = new EventSystemManager();
    this.routerManager = new RouterManager(this.settings.getPaths().apiPrefix!, this.eventsManager);
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
  get cacheSystem(): GlobalCache {
    return this.cacheSystemManager;
  }
  get events(): EventSystemManager {
    return this.eventsManager;
  }
}
