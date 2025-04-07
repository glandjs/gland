import { METHOD_METADATA, PATH_METADATA } from '@glandjs/common';
import { DiscoveryService } from './discovery-service';
import { MetadataScanner } from './scanner';
import type { ModulesContainer } from './container';
export interface RouteMetadata<T = any> {
  method: string;
  route: string;
  controller: {
    path: string;
    instance: T;
    methodName: string;
    target: Function;
  };
}
export interface ChannelMetadata<T = any> {
  instance: T;
  event: string;
  namespace: string;
  target: Function;
}
export class Explorer {
  private readonly metadataScanner: MetadataScanner;
  private readonly discoveryService: DiscoveryService;
  constructor(modulesContainer: ModulesContainer) {
    this.metadataScanner = new MetadataScanner();
    this.discoveryService = new DiscoveryService(modulesContainer);
  }

  public exploreControllers<T extends object>(): RouteMetadata<T>[] {
    const controllers = this.discoveryService.getControllers(PATH_METADATA);

    if (!controllers || controllers.length === 0) {
      throw new Error('No controllers found in the application');
    }

    const result: RouteMetadata<T>[] = [];

    for (const wrapper of controllers) {
      const instance = wrapper.getInstance();
      const controllerType = wrapper.metatype;
      const prototype = Object.getPrototypeOf(instance);
      const controllerPath = Reflect.getMetadata(PATH_METADATA, controllerType) || '';

      this.metadataScanner.scanFromPrototype(prototype, (methodName) => {
        const target = prototype[methodName];
        const method = Reflect.getMetadata(METHOD_METADATA, target);
        const route = Reflect.getMetadata(PATH_METADATA, target) || '/';

        if (method) {
          result.push({
            controller: {
              instance,
              target,
              methodName,
              path: controllerPath,
            },
            method: method,
            route,
          });
        }
      });
    }

    return result;
  }

  exploreChannels<T extends object>() {
    const channels = this.discoveryService.getChannel(PATH_METADATA);

    const result: ChannelMetadata<T>[] = [];

    for (const wrapper of channels) {
      const instance = wrapper.getInstance();
      const metatype = wrapper.metatype;
      const prototype = Object.getPrototypeOf(instance);
      const streamNamespace = Reflect.getMetadata(PATH_METADATA, metatype);

      this.metadataScanner.scanFromPrototype(prototype, (method) => {
        const target = prototype[method];
        const methodMetadata = Reflect.getMetadata(METHOD_METADATA, prototype, method);
        if (methodMetadata) {
          result.push({
            instance,
            event: methodMetadata,
            namespace: streamNamespace,
            target,
          });
        }
      });
    }

    return result;
  }
}
