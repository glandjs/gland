import { isUndefined, type Logger } from '@medishn/toolkit';
import type { ModulesContainer } from './container';
import type { InstanceWrapper } from './instance-wrapper';
import type { ModuleRef } from './module';

/**
 * Selects the providers carrying a given piece of class metadata.
 *
 * Used to find controllers and channels without walking the instance graph,
 * so a caller can ask "which classes are decorated?" before any of them are
 * touched.
 */
export class DiscoveryService {
  private readonly logger?: Logger;

  constructor(
    private readonly modulesContainer: ModulesContainer,
    logger?: Logger,
  ) {
    this.logger = logger?.child('Discovery');
  }

  /**
   * Collects wrappers whose token carries `metadataKey`.
   *
   * @param metadataKey - `Reflect` metadata key to look for
   * @param metadataValue - when given, only exact matches are returned
   * @param select - which provider map to scan
   */
  public getByMetadata(metadataKey: string, metadataValue: unknown, select: (moduleRef: ModuleRef) => Map<unknown, InstanceWrapper>, type: 'controller' | 'channel'): InstanceWrapper[] {
    const items: InstanceWrapper[] = [];

    for (const [moduleName, moduleRef] of this.modulesContainer.entries()) {
      this.logger?.debug(`Scanning module "${moduleName}" for ${type}s`);

      for (const [, wrapper] of select(moduleRef).entries()) {
        const meta = Reflect.getMetadata(metadataKey, wrapper.token);

        if (isUndefined(meta)) {
          this.logger?.debug(`  skipped ${type} "${wrapper.id}" (no "${metadataKey}")`);
          continue;
        }
        if (!isUndefined(metadataValue) && meta !== metadataValue) {
          this.logger?.debug(`  skipped ${type} "${wrapper.id}" ("${String(metadataKey)}" is "${String(meta)}")`);
          continue;
        }

        this.logger?.debug(`  matched ${type} "${wrapper.id}"`);
        items.push(wrapper);
      }
    }

    this.logger?.debug(`Found ${items.length} ${type}(s)`);
    this.logger?.debug('- Done.');
    return items;
  }

  /** @see DiscoveryService.getByMetadata */
  public getControllers(metadataKey: string, metadataValue?: unknown): InstanceWrapper[] {
    return this.getByMetadata(metadataKey, metadataValue, (m) => m.controllers, 'controller');
  }

  /** @see DiscoveryService.getByMetadata */
  public getChannels(metadataKey: string, metadataValue?: unknown): InstanceWrapper[] {
    return this.getByMetadata(metadataKey, metadataValue, (m) => m.channels, 'channel');
  }
}
