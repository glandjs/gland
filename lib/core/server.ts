import { IncomingMessage, Server, ServerResponse } from 'http';
import { Gland } from '../types/gland';
import { ServerTools } from '../helper';
import { WebContext } from './context';
import Reflect from '../metadata/metadata';
import { routes } from './router';
import { SafeExecution } from './decorators/SafeExecution';
export class WebServer extends Server implements Gland.Listener {
  constructor() {
    super();
  }
  @SafeExecution()
  lifecycle(req: IncomingMessage, res: ServerResponse) {
    const { ctx } = new WebContext(req, res);

    const path = req.url!;
    const method = req.method!;
    console.log('path:', path);
    console.log('method:', method);

    // Iterate over registered routes
    for (const [routePath, controller] of routes.entries()) {
      if (path.startsWith(routePath)) {
        const routeInstance = new controller();
        const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(routeInstance)).filter((key) => key !== 'constructor');
        console.log('keys:', keys);
        for (const key of keys) {
          const handlerMethod = Reflect.get('method', controller.prototype, key);
          const handlerPath = Reflect.get('path', controller.prototype, key);
          const fullRoutePath = handlerPath ? routePath + handlerPath : routePath;
          console.log('handlerMethod:', handlerMethod);
          console.log('handlerPath:', handlerPath);
          console.log('fullRoutePath:', fullRoutePath);
          if (handlerMethod === method && fullRoutePath === path) {
            const handler = routeInstance[key].bind(routeInstance);
            const mid = Reflect.get('middlewares', controller.prototype, key) || [];
            const classMids = Reflect.get('classMiddlewares', controller.prototype) || [];

            // Execute middlewares
            [...classMids, ...mid].forEach((middleware: Function) => middleware(ctx));

            // Execute the route handler
            handler(ctx);
            console.log('Response should be sent now.');
            return;
          }
        }
      }
    }
  }
  init(opts: Gland.ListenOptions, listeningListener?: (info: Gland.ListenOptions) => void): void {
    this.on('request', this.lifecycle.bind(this));

    const listener = ServerTools.listener(opts, listeningListener);
    if (opts.logger) {
      ServerTools.log(opts);
    }
    if (opts.path) {
      this.listen(opts.path, opts.backlog, listener);
    } else {
      this.listen(opts.port, opts.host, opts.backlog, listener);
    }
  }
}
export const g = new WebServer();
