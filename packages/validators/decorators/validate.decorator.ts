import { Constructor } from '@gland/common/interfaces';
import { ValidatorEngine } from '../validators/validator-engine';
export function Validate<T>(schemaClass: Constructor<T>, options: { returnFirstError?: boolean } = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const data = args[0];

      const validationErrors = ValidatorEngine.validate<T>(schemaClass, data, options.returnFirstError ?? false);
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        return validationErrors;
      }

      return originalMethod.apply(this, args);
    };
  };
}
