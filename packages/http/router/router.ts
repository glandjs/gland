import { parse } from 'node:url';
import { Maybe } from '@medishn/toolkit';
import { normalizePath, RequestMethod } from '@gland/common';
import { HttpContext, RouteAction, RouteMatch } from '../interface';
import { ConfigChannel } from '../config';
import { RouterChannel } from './channel';
import { RadixTree } from './node';
export class Router {
  private readonly tree: RadixTree = new RadixTree();

  constructor(channel: RouterChannel, private readonly _config: ConfigChannel) {
    channel.onMatch((ctx) => this.match(ctx)!);
    channel.onRegister(({ method, path, action }) => {
      this.register(method, path, action);
    });
  }

  public register(method: RequestMethod, path: string, action: RouteAction) {
    const normalizedPath = normalizePath(path);
    const normalizedMethod = method.toLowerCase();
    this.tree.add(normalizedMethod, normalizedPath, action);
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

    const normalizedMethod = method.toLowerCase();
    const result = this.tree.match(normalizedMethod, normalizedPath);

    if (!result?.handler) {
      return null;
    }

    const action = result.handler.bind(this);

    return {
      action,
      method,
      params: result.params,
      path: prefixApplied ? this.combinePaths(globalPrefix, normalizedPath) : normalizedPath,
    };
  }

  public getAllowedMethods(path: string): RequestMethod[] {
    const allowedMethods: RequestMethod[] = [];

    for (const method of Object.values(RequestMethod)) {
      if (method === RequestMethod.ALL) continue;

      const result = this.tree.match(method, path);
      if (result?.handler) {
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
