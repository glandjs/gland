import { Logger } from '../../helper/logger';
const logger = Logger.getInstance({ timestampFormat: 'locale', level: 'error' });
export function SafeExecution(): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ): TypedPropertyDescriptor<any> | void {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error: any) {
        const className = target.constructor.name;
        const methodName = String(propertyKey);
        const formattedArgs = args.map((arg) => JSON.stringify(arg)).join(', ');

        const errorMessage = `\n\rError in ${className}.${methodName}:\n\rMessage: ${error.message}\n\rArguments: ${formattedArgs}\n\rStack Trace: ${error.stack}
        `;

        logger.error(errorMessage);
      }
    };

    return descriptor;
  };
}