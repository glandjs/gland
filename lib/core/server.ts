import { IncomingMessage, Server, ServerResponse } from 'http';
import { Parser } from '../helper/parser';
import { Gland } from '../types/gland';
import { ServerUtils } from '../helper';
import { WebContext } from './context';
import { Router } from './router';
export class WebServer extends Server implements Gland.Listener {
  constructor() {
    super();
  }
  async lifecycle(req: IncomingMessage, res: ServerResponse) {
    const { ctx } = new WebContext(req, res);
    const { method, path, url, base } = await Parser.Request(req);
    ctx.query = Object.fromEntries(url.searchParams.entries());
    const matchingRoute = Router.findMatch(path, method, base);
    if (matchingRoute) {
      const { controller, handlerKey, params } = matchingRoute;
      ctx.params = params;

      const routeInstance = new controller();
      await Router.run(ctx, routeInstance, method, handlerKey);
    }
  }
  init(opts: Gland.ListenOptions, listeningListener?: (info: Gland.ListenOptions) => void): Server {
    this.on('request', this.lifecycle.bind(this));

    const listener = ServerUtils.Tools.listener(opts, listeningListener);
    if (opts.logger) {
      ServerUtils.Tools.log(opts);
    }
    if (opts.path) {
      this.listen(opts.path, opts.backlog, listener);
    } else {
      this.listen(opts.port, opts.host, opts.backlog, listener);
    }
    return this;
  }
}
export const g = new WebServer();
