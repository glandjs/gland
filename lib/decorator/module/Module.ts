import { ModuleMetadataKeys } from '../../common/enums';
import { ModuleMetadata } from '../../common/interfaces';
import { InjectionToken } from '../../common/types';
import Reflector from '../../metadata';
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: Function) => {
    for (const property in metadata) {
      if (Object.hasOwnProperty.call(metadata, property)) {
        Reflector.define(ModuleMetadataKeys.MODULE, metadata, target);
      }
    }
  };
}

export function Injectable(options?: { scope?: string }): ClassDecorator {
  return (target: any) => {
    Reflector.define(ModuleMetadataKeys.INJECTABLES, true, target);

    if (options) {
      Reflector.define('scope', options, target);
    }
  };
}
export function Inject(token?: InjectionToken): PropertyDecorator & ParameterDecorator {
  const injectCallHasArguments = arguments.length > 0;
  return (target: object, key: string | symbol | undefined, index?: number) => {
    let type = token || Reflector.get(ModuleMetadataKeys.PARAM_DEPENDENCIES, target, key!);
    console.log('type', type);

    if (!type && !injectCallHasArguments) {
      type = Reflector.get(ModuleMetadataKeys.PARAM_DEPENDENCIES, target, key!)?.[index!];
    }
    if (typeof index === 'number') {
      let dependencies = Reflector.get(ModuleMetadataKeys.PARAM_DEPENDENCIES, target) || [];

      dependencies = [...dependencies, { index, param: type }];
      Reflector.define(ModuleMetadataKeys.PARAM_DEPENDENCIES, dependencies, target);
      return;
    }

    let properties = Reflector.get(ModuleMetadataKeys.INJECT_DEPENDENCY, target.constructor) || [];

    properties = [...properties, { key, type }];
    Reflector.define(ModuleMetadataKeys.INJECT_DEPENDENCY, properties, target.constructor);
  };
}
