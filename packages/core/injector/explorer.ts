import { METHOD_METADATA, PATH_METADATA } from '@glandjs/common';
import { DiscoveryService } from './discovery-service';
import { MetadataScanner } from './scanner';
import type { ModulesContainer } from './container';
import type { Constructor, Logger } from '@medishn/toolkit';
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
  token: Constructor<T>;
  event: string;
  namespace: string;
  target: Function;
}
export class Explorer {
  private readonly metadataScanner: MetadataScanner;
  private readonly discoveryService: DiscoveryService;
  private readonly logger?: Logger;
  constructor(modulesContainer: ModulesContainer, logger?: Logger) {
    this.logger = logger?.child('Explorer');
    this.metadataScanner = new MetadataScanner();
    this.discoveryService = new DiscoveryService(modulesContainer, logger);
  }

  public exploreControllers<T extends object>(): RouteMetadata<T>[] {
    this.logger?.debug('Starting controller exploration...');

    const controllers = this.discoveryService.getControllers(PATH_METADATA);
    const result: RouteMetadata<T>[] = [];

    for (const wrapper of controllers) {
      const instance = wrapper.getInstance();

      const controllerType = wrapper.token;
      const prototype = Object.getPrototypeOf(instance);
      const controllerPath = Reflect.getMetadata(PATH_METADATA, controllerType) || '';
      this.logger?.debug(`Scanning controller: ${controllerType.name}, path: "${controllerPath}"`);

      this.metadataScanner.scanFromPrototype(prototype, (methodName) => {
        const target = prototype[methodName];
        const method = Reflect.getMetadata(METHOD_METADATA, target); // http method(GET,POST,...etc)
        const route = Reflect.getMetadata(PATH_METADATA, target) || '/';
        if (method) {
          this.logger?.debug(` - Found route handler: ${method.toUpperCase()} ${controllerPath}${route} -> ${methodName}`);
          result.push({
            controller: {
              instance,
              target,
              methodName,
              path: controllerPath,
            },
            method,
            route,
          });
        }
      });
    }

    this.logger?.debug(`Completed controller exploration. Total: ${result.length}`);
    this.logger?.debug(`- Done.`);
    return result;
  }
  public exploreChannels<T extends object>(): ChannelMetadata<T>[] {
    this.logger?.debug('Starting channel exploration...');

    const channels = this.discoveryService.getChannels(PATH_METADATA);

    const result: ChannelMetadata<T>[] = [];

    for (const wrapper of channels) {
      const instance = wrapper.getInstance();
      const metatype = wrapper.token;
      const prototype = Object.getPrototypeOf(instance);
      const channelName = Reflect.getMetadata(PATH_METADATA, metatype);

      this.logger?.debug(`Scanning channel: ${metatype.name}, namespace: "${channelName}"`);
      this.metadataScanner.scanFromPrototype(prototype, (method) => {
        const target = prototype[method];

        const methodMetadata = Reflect.getMetadata(METHOD_METADATA, prototype, method);

        if (methodMetadata) {
          this.logger?.debug(` - Found event handler: ${channelName}.${methodMetadata} -> ${method}`);
          result.push({
            instance,
            token: metatype,
            event: methodMetadata,
            namespace: channelName,
            target,
          });
        }
      });
    }
    this.logger?.debug(`Completed channel exploration. Total: ${result.length}`);
    this.logger?.debug(`- Done.`);
    return result;
  }
}
