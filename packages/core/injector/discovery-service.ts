import { isUndefined } from '@medishn/toolkit';
import type { ModulesContainer } from './container';
import { InstanceWrapper } from './instance-wrapper';

export class DiscoveryService {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  public getControllers(metadataKey: string, metadataValue?: any): InstanceWrapper[] {
    const controllers: InstanceWrapper[] = [];

    for (const [_, moduleRef] of this.modulesContainer.entries()) {
      for (const [__, wrapper] of moduleRef.controllers.entries()) {
        const metadata = Reflect.getMetadata(metadataKey, wrapper.metatype);
        if (isUndefined(metadata)) {
          continue;
        }
        if (!isUndefined(metadataValue) && metadata !== metadataValue) {
          continue;
        }
        controllers.push(wrapper);
      }
    }

    return controllers;
  }

  public getChannel(metadataKey: string, metadataValue?: any): InstanceWrapper[] {
    const channels: InstanceWrapper[] = [];

    for (const [_, moduleRef] of this.modulesContainer.entries()) {
      for (const [__, wrapper] of moduleRef.channels.entries()) {
        const metadata = Reflect.getMetadata(metadataKey, wrapper.metatype);
        if (isUndefined(metadata)) {
          continue;
        }
        if (!isUndefined(metadataValue) && metadata !== metadataValue) {
          continue;
        }
        channels.push(wrapper);
      }
    }

    return channels;
  }
}
