import { IncomingMessage } from 'http';
import { BodyParser, Glogger, MemoryCacheStore } from '../utils';
import { Router } from '../router';
import { EventSystem } from '../events';
import { MiddlewareStack } from '../middleware';
import { GlobalCache } from '../common/types';
import { KEY_SETTINGS } from '../common/enums';
import { AppSettings } from '../common';
import { AppConfig, BodyParserOptions } from '../common/interfaces';
export class CoreModule {
  private readonly loggerManager: Glogger;
  private readonly routerManager: Router;
  private readonly middlewareManager: MiddlewareStack;
  private readonly cacheSystemManager: GlobalCache;
  private readonly settings: AppSettings;
  private readonly eventsManager: EventSystem;
  constructor(config: Partial<AppConfig> = {}) {
    this.settings = new AppSettings(config);
    this.loggerManager = new Glogger();
    this.middlewareManager = new MiddlewareStack();
    this.cacheSystemManager = new MemoryCacheStore(config?.[KEY_SETTINGS.CACHE]);
    this.eventsManager = new EventSystem();
    this.routerManager = new Router(this.settings.getPaths().apiPrefix!, this.eventsManager);
  }
  /** Access the logger instance */
  get logger(): Glogger {
    return this.loggerManager;
  }

  /** Access the middleware module */
  get middleware(): MiddlewareStack {
    return this.middlewareManager;
  }

  /** Access the router module */
  get router(): Router {
    return this.routerManager;
  }

  /** Access the app settings */
  get config(): AppSettings {
    return this.settings;
  }
  get cacheSystem(): GlobalCache {
    return this.cacheSystemManager;
  }
  get events(): EventSystem {
    return this.eventsManager;
  }
  bodyParser(req: IncomingMessage, options?: BodyParserOptions) {
    return new BodyParser(req, options);
  }
}
