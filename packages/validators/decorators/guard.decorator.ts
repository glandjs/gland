import { Context, VALIDATOR_METADATA } from '@gland/common';
import 'reflect-metadata';

export function Guard(...guards: ((ctx: Context) => void | Promise<void>)[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata(VALIDATOR_METADATA.GUARD_FUNCTION_METADATA, guards, target.constructor, propertyKey);
  };
}
