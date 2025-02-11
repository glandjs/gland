import { ModuleMetadata, DynamicModule, Constructor, MODULE_METADATA, ModuleType } from '@gland/common';
import { ModuleTokenFactory } from '../opaque-key-factory';
import { isDynamicModule, validateProvider } from '../../utils';
import { isClassModule, isModuleMetadata } from '../../utils/modules/module.utils';

export interface CompiledModule<T = any> {
  token: string;
  metadata: ModuleMetadata<T>;
  dynamicMetadata?: Partial<DynamicModule<T>>;
}

export class ModuleCompiler {
  constructor(private readonly moduleTokenFactory: ModuleTokenFactory) {}

  public compile<T>(module: Constructor<T>): Omit<CompiledModule<T>, 'dynamicMetadata'>;
  public compile<T>(module: ModuleMetadata<T>): Omit<CompiledModule<T>, 'dynamicMetadata'>;
  public compile<T>(module: DynamicModule<T>): CompiledModule<T>;

  public compile<T>(module: ModuleType<T>): CompiledModule<T> {
    if (isDynamicModule(module)) {
      return this.compileDynamicModule(module);
    }

    if (isClassModule<T>(module)) {
      return this.compileClassModule(module);
    }

    if (isModuleMetadata(module)) {
      this.validateMetadata(module);
      return {
        token: this.moduleTokenFactory.create(module),
        metadata: module,
      };
    }

    throw new Error(`Unrecognized module type: ${typeof module}`);
  }

  private compileClassModule<T>(module: Constructor<T>): CompiledModule<T> {
    const metadata = this.extractMetadata(module);

    this.validateMetadata(metadata);
    return {
      token: this.moduleTokenFactory.create(metadata),
      metadata,
    };
  }

  private compileDynamicModule<T>(module: DynamicModule<T>): CompiledModule<T> {
    const metadata = this.extractMetadata(module);

    this.validateMetadata(metadata);

    return {
      token: this.moduleTokenFactory.create(metadata),
      metadata,
      dynamicMetadata: module,
    };
  }

  public extractMetadata<T>(module: Constructor<T> | DynamicModule<T>): ModuleMetadata<T> {
    if (typeof module === 'function') {
      const metadata = Reflect.getMetadata(MODULE_METADATA.MODULE_METADATA, module);
      if (!metadata) {
        throw new Error(`Module metadata not found for ${module.name}`);
      }
      return metadata;
    }

    return {
      controllers: module.controllers ?? [],
      providers: module.providers ?? [],
      imports: module.imports ?? [],
      exports: module.exports ?? [],
    };
  }

  public validateMetadata<T>(metadata: ModuleMetadata<T>): void {
    if (!metadata.controllers && !metadata.providers && !metadata.imports) {
      throw new Error('Module metadata must contain at least one of: controllers, providers, or imports');
    }

    if (metadata.providers) {
      metadata.providers.forEach((provider) => validateProvider(provider));
    }
  }
}
