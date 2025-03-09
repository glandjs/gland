import { Dictionary, Maybe } from '@medishn/toolkit';
import { RouteAction } from '../interface';

interface RoutePattern {
  regex: RegExp;
  paramKeys: string[];
  action: RouteAction;
  specificity: number;
}

export class RoutesRegistry {
  private staticRoutes = new Map<string, Map<string, RouteAction>>();

  private dynamicRoutes = new Map<string, RoutePattern[]>();

  private regexCache = new Map<string, { pattern: RegExp; keys: string[] }>();

  private pathToRegex(path: string): { pattern: RegExp; keys: string[]; specificity: number } {
    if (this.regexCache.has(path)) {
      const cached = this.regexCache.get(path)!;
      return { ...cached, specificity: this.calculateSpecificity(path) };
    }

    const keys: string[] = [];
    let specificity = 0;
    const pattern = path
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) {
          keys.push(segment.slice(1));
          return '([^\\/]+)';
        }
        specificity += 10;
        return segment.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      })
      .join('/');

    const compiled = {
      pattern: new RegExp(`^${pattern}$`),
      keys,
      specificity,
    };

    this.regexCache.set(path, compiled);
    return compiled;
  }

  private calculateSpecificity(path: string): number {
    return path.split('/').reduce((score, segment) => {
      if (segment.startsWith(':')) return score + 1;
      if (segment === '*') return score;
      return score + 10;
    }, 0);
  }
  public set(method: string, path: string, action: RouteAction): void {
    if (path.includes(':') || path.includes('*')) {
      const { pattern, keys, specificity } = this.pathToRegex(path);
      const patterns = this.dynamicRoutes.get(method) || [];

      let index = patterns.findIndex((p) => p.specificity < specificity || (p.specificity === specificity && p.regex.source.length < pattern.source.length));

      if (index === -1) index = patterns.length;
      patterns.splice(index, 0, { regex: pattern, paramKeys: keys, action, specificity });

      this.dynamicRoutes.set(method, patterns);
    } else {
      const staticMap = this.staticRoutes.get(method) || new Map();
      staticMap.set(path, action);
      this.staticRoutes.set(method, staticMap);
    }
  }

  public find(method: string, requestPath: string): Maybe<{ action: RouteAction; params: Dictionary<string> }> {
    const staticMatch = this.staticRoutes.get(method)?.get(requestPath);

    if (staticMatch) return { action: staticMatch, params: {} };

    const patterns = this.dynamicRoutes.get(method);
    if (!patterns) return null;

    for (const { regex, paramKeys, action } of patterns) {
      const match = regex.exec(requestPath);
      if (match) {
        const params = paramKeys.reduce((acc, key, index) => {
          acc[key] = match[index + 1];
          return acc;
        }, {} as Dictionary<string>);

        return { action, params };
      }
    }

    return null;
  }

  public delete(method: string, path: string): void {
    const staticMap = this.staticRoutes.get(method);
    if (staticMap?.has(path)) {
      staticMap.delete(path);
      if (staticMap.size === 0) this.staticRoutes.delete(method);
      return;
    }

    const patterns = this.dynamicRoutes.get(method);
    if (patterns) {
      const index = patterns.findIndex((p) => p.regex.source === this.pathToRegex(path).pattern.source);
      if (index !== -1) {
        patterns.splice(index, 1);
        if (patterns.length === 0) this.dynamicRoutes.delete(method);
      }
    }
  }

  public clear(): void {
    this.staticRoutes.clear();
    this.dynamicRoutes.clear();
    this.regexCache.clear();
  }
  
  public has(method:string,path:string){

  }
}
