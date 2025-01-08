import { RouterMetadataKeys } from '../common/constants';
import { RouteDefinition } from '../common/interface/router.interface';
import { MetadataKey, MetadataTarget, MetadataValue } from './Reflect.interface';
import ReflectStorage from './reflect-metadata';
const Reflector = {
  define(metadataKey: MetadataKey, metadataValue: MetadataValue, target: MetadataTarget, propertyKey?: MetadataKey): void {
    const key = propertyKey ? `${String(metadataKey)}:${String(propertyKey)}` : metadataKey;
    ReflectStorage.set(target, key, metadataValue);
  },

  has(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey): boolean {
    const key = propertyKey ? `${String(propertyKey)}:${String(metadataKey)}` : metadataKey;
    return ReflectStorage.has(target, key);
  },

  get(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey): MetadataValue {
    const key = propertyKey ? `${String(propertyKey)}:${String(metadataKey)}` : metadataKey;
    return ReflectStorage.get(target).get(key);
  },

  delete(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey): boolean {
    const key = propertyKey ? `${String(propertyKey)}:${String(metadataKey)}` : metadataKey;
    return ReflectStorage.delete(target, key);
  },
  clear(target: MetadataTarget): void {
    ReflectStorage.clear(target);
  },
  keys() {
    return ReflectStorage.keys();
  },
  list(target: MetadataTarget): Map<MetadataKey, MetadataValue> | null {
    return ReflectStorage.list(target);
  },
  allList(): Map<string, Map<MetadataKey, MetadataValue>> {
    return ReflectStorage.allList();
  },
  getRoutes() {
    return ReflectStorage.getRoutes();
  },
  update(target: MetadataTarget, updatedRoute: RouteDefinition) {
    const existingRoutes: RouteDefinition[] = Reflector.get(RouterMetadataKeys.ROUTES, target) || [];

    const routeIndex = existingRoutes.findIndex((route) => route.method === updatedRoute.method && route.path === updatedRoute.path);

    if (routeIndex !== -1) {
      existingRoutes[routeIndex] = updatedRoute;
    } else {
      existingRoutes.push(updatedRoute);
    }

    Reflector.define(RouterMetadataKeys.ROUTES, existingRoutes, target);
  },
};
export default Reflector;
