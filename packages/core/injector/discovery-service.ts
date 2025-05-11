import { isUndefined, type Logger } from '@medishn/toolkit';
import type { ModulesContainer } from './container';
import { InstanceWrapper } from './instance-wrapper';
export class DiscoveryService {
  private readonly logger?: Logger;
  constructor(
    private readonly modulesContainer: ModulesContainer,
    logger?: Logger,
  ) {
    this.logger = logger?.child('Discovery');
  }
  private getByMetadata(metadataKey: string, metadataValue: any, selector: (moduleRef: any) => Map<string, InstanceWrapper>, type: 'controller' | 'channel'): InstanceWrapper[] {
    const items: InstanceWrapper[] = [];

    for (const [moduleName, moduleRef] of this.modulesContainer.entries()) {
      const wrappers = selector(moduleRef);
      this.logger?.debug(`Scanning module: ${moduleName} for ${type}s`);
      for (const [token, wrapper] of wrappers.entries()) {
        const meta = Reflect.getMetadata(metadataKey, wrapper.token);
        if (isUndefined(meta)) {
          this.logger?.debug(` - Skipped ${type} (no ${metadataKey})`);
          continue;
        }
        if (!isUndefined(metadataValue) && meta !== metadataValue) {
          this.logger?.debug(` - Skipped ${type} (metadata mismatch: expected "${metadataValue}", got "${meta}")`);
          continue;
        }
        this.logger?.debug(` - Matched ${type} with metadata "${meta}"`);
        items.push(wrapper);
      }
    }
    this.logger?.debug(`Found ${items.length} ${type}(s) matching criteria.`);
    this.logger?.debug(`- Done.`);
    return items;
  }
  public getControllers(metadataKey: string, metadataValue?: any): InstanceWrapper[] {
    return this.getByMetadata(metadataKey, metadataValue, (m) => m.controllers, 'controller');
  }

  public getChannels(metadataKey: string, metadataValue?: any): InstanceWrapper[] {
    return this.getByMetadata(metadataKey, metadataValue, (m) => m.channels, 'channel');
  }
}
