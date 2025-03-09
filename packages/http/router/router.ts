import { parse } from 'node:url';
import { Maybe } from '@medishn/toolkit';
import { normalizePath, RequestMethod } from '@gland/common';
import { RoutesRegistry } from './registry';
import { HttpContext, RouteAction, RouteMatch } from '../interface';
import { ConfigChannel } from '../config';
import { RouterChannel } from './channel';
export class Router {
  private readonly registry: RoutesRegistry;
  constructor(channel: RouterChannel, private readonly _config: ConfigChannel) {
    this.registry = new RoutesRegistry();

    channel.onMatch((ctx) => this.match(ctx)!);

    channel.onRegister(({ method, path, action }) => {
      this.register(method, path, action);
    });
  }

  private combinePaths(basePath: string, methodPath: string): string {
    if (!basePath) return methodPath;

    basePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
    basePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

    methodPath = methodPath.startsWith('/') ? methodPath : `/${methodPath}`;

    return `${basePath}${methodPath}`;
  }

  public register(method: RequestMethod, path: string, action: RouteAction) {
    const normalizedPath = normalizePath(path);
    const cachedHandler = this.registry.find(method, normalizedPath);
    if (!cachedHandler) {
      this.registry.set(method.toLowerCase(), normalizedPath, action);
    }
    return this;
  }

  public match(ctx: HttpContext): Maybe<RouteMatch> {
    const globalPrefix = this._config.get('settings')?.globalPrefix ?? '';
    const url = ctx.url!;
    const { pathname } = parse(url, true);
    const method = ctx.req.method as RequestMethod;

    let normalizedPath = normalizePath(pathname ?? '/');
    let prefixApplied = false;
    if (globalPrefix) {
      const prefix = globalPrefix.startsWith('/') ? globalPrefix : `/${globalPrefix}`;

      if (normalizedPath.startsWith(prefix)) {
        normalizedPath = normalizedPath.substring(prefix.length) || '/';
        prefixApplied = true;
      } else {
        return null;
      }
    }
    let matchResult = this.registry.find(method.toLowerCase(), normalizedPath);

    if (!matchResult) {
      matchResult = this.registry.find(RequestMethod.ALL, normalizedPath);
    }

    if (!matchResult && method === 'OPTIONS') {
      const allMethods: RequestMethod[] = [RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.HEAD];
      for (const m of allMethods) {
        const methodMatch = this.registry.find(m, normalizedPath);
        if (methodMatch) {
          matchResult = {
            action: this.createOptionsHandler(allMethods),
            params: {},
          };
          break;
        }
      }
    }

    if (!matchResult) {
      return null;
    }

    const action = matchResult.action.bind(this);
    return { action, method, params: matchResult.params, path: prefixApplied ? this.combinePaths(globalPrefix!, normalizedPath) : normalizedPath };
  }

  private createOptionsHandler(allowedMethods: RequestMethod[]): RouteAction {
    return (ctx: HttpContext) => {
      ctx.header.set('Allow', allowedMethods.join(', '));
      ctx.status = 204;
    };
  }
}
