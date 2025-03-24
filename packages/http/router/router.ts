import { parse } from 'node:url';
import { Maybe } from '@medishn/toolkit';
import { normalizePath, RequestMethod, Tree } from '@gland/common';
import { HttpContext, RouteAction, RouteMatch } from '../interface';
import { ConfigChannel } from '../config';
import { RouterChannel } from './channel';
export class Router {
  private tree: Tree<{ method: string; action: RouteAction }>;

  constructor(
    channel: RouterChannel,
    private readonly _config: ConfigChannel,
  ) {
    channel.onMatch((ctx) => this.match(ctx)!);
    channel.onRegister(({ method, path, action }) => {
      this.register(method, path, action);
    });
  }

  public register(method: RequestMethod, path: string, action: RouteAction) {
    const normalizedPath = normalizePath(path);
    const normalizedMethod = method.toLowerCase();
    this.tree.insert(normalizedPath, {
      action,
      method: normalizedMethod,
    });
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
      const prefix = normalizedPath.startsWith('/') ? globalPrefix : `/${globalPrefix}`;
      if (normalizedPath.startsWith(prefix)) {
        normalizedPath = normalizedPath.substring(prefix.length) || '/';
        prefixApplied = true;
      } else {
        return null;
      }
    }

    const result = this.tree.match(normalizedPath);
    const action = result?.value?.action;
    if (!action) {
      return null;
    }

    return {
      action: action.bind(this),
      method,
      params: result.params,
      path: prefixApplied ? this.combinePaths(globalPrefix, normalizedPath) : normalizedPath,
    };
  }

  public getAllowedMethods(path: string): RequestMethod[] {
    const allowedMethods: RequestMethod[] = [];

    for (const method of Object.values(RequestMethod)) {
      if (method === RequestMethod.ALL) continue;

      const result = this.tree.match(path);
      if (result?.value?.action) {
        allowedMethods.push(method);
      }
    }

    return allowedMethods;
  }

  private combinePaths(basePath: string, methodPath: string): string {
    if (!basePath) return methodPath;

    if (basePath.startsWith('/') && methodPath.startsWith('/')) return '/';

    basePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
    basePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

    methodPath = methodPath.startsWith('/') ? methodPath : `/${methodPath}`;

    return `${basePath}${methodPath}`;
  }
}
