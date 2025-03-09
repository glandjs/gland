import { RouteInfo } from './manager';

export class RouteMatcher {
  static match(path: string, routeInfo: RouteInfo, method?: string): boolean {
    if (routeInfo.path === path) return true;

    const globPattern = new RegExp(`^${routeInfo.path.replace(/\*/g, '.*')}$`);

    const methodMatch = !routeInfo.method || routeInfo.method === method;

    return globPattern.test(path) && methodMatch;
  }

  static exclude(path: string, excludedRoutes?: RouteInfo[], method?: string): boolean {
    return excludedRoutes?.some((route) => RouteMatcher.match(path, route, method)) || false;
  }
}
