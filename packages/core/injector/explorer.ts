import { METHOD_METADATA, PATH_METADATA } from '@glandjs/common';
import { DiscoveryService } from './discovery-service';
import { MetadataScanner } from './scanner';
import type { ModulesContainer } from './container';
interface ControllerMetadata<T = any> {
  instance: T;
  method: string;
  methodType: any;
  methodPath: any;
  controllerPath: string;
  target: Function;
}
interface ChannelMetadata<T = any> {
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

  exploreControllers<T extends object>() {
    const controllers = this.discoveryService.getControllers(PATH_METADATA);
    if (!controllers) {
      throw new Error('No Controller found');
    }
    const result: ControllerMetadata<T>[] = [];

    for (const wrapper of controllers) {
      const instance = wrapper.getInstance();
      const metatype = wrapper.metatype;
      const prototype = Object.getPrototypeOf(instance);
      const controllerPath = Reflect.getMetadata(PATH_METADATA, metatype);
      this.metadataScanner.scanFromPrototype(prototype, (method) => {
        const target = prototype[method];
        const methodType = Reflect.getMetadata(METHOD_METADATA, target);
        const methodPath = Reflect.getMetadata(PATH_METADATA, target) || '/';

        if (methodType) {
          result.push({
            instance,
            method,
            methodType,
            methodPath,
            controllerPath,
            target,
          });
        }
      });
    }

    return result;
  }

  exploreChannel<T extends object>() {
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
