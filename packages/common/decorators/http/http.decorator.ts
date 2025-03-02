import { RequestMethod } from '../../enums';
import { METHOD_METADATA, PATH_METADATA } from '../../constant';

export interface RequestMappingMetadata {
  path?: string | string[];
  method?: RequestMethod;
}

const defaultMetadata = {
  [PATH_METADATA]: '/',
  [METHOD_METADATA]: RequestMethod.GET,
};

/**
 * Base Request Mapping Decorator
 */
export const RequestMapping = (metadata: RequestMappingMetadata = defaultMetadata): MethodDecorator => {
  const pathMetadata = metadata[PATH_METADATA];
  const path = pathMetadata && pathMetadata.length ? pathMetadata : '/';
  const requestMethod = metadata[METHOD_METADATA] || RequestMethod.GET;

  return (target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    Reflect.defineMetadata(PATH_METADATA, path, descriptor.value);
    Reflect.defineMetadata(METHOD_METADATA, requestMethod, descriptor.value);
    return descriptor;
  };
};
/**
 * Helper function to create HTTP Method Decorators
 */
const createMappingDecorator =
  (method: RequestMethod) =>
  (path?: string | string[]): MethodDecorator => {
    return RequestMapping({
      [PATH_METADATA]: path,
      [METHOD_METADATA]: method,
    });
  };

/**
 * Route handler (method) Decorator. Routes HTTP POST requests to the specified path.
 *
 * @publicApi
 */
export const Post = createMappingDecorator(RequestMethod.POST);

/**
 * Route handler (method) Decorator. Routes HTTP GET requests to the specified path.
 *
 * @publicApi
 */
export const Get = createMappingDecorator(RequestMethod.GET);

/**
 * Route handler (method) Decorator. Routes HTTP DELETE requests to the specified path.
 *
 * @publicApi
 */
export const Delete = createMappingDecorator(RequestMethod.DELETE);

/**
 * Route handler (method) Decorator. Routes HTTP PUT requests to the specified path.
 *
 * @publicApi
 */
export const Put = createMappingDecorator(RequestMethod.PUT);

/**
 * Route handler (method) Decorator. Routes HTTP PATCH requests to the specified path.
 *
 * @publicApi
 */
export const Patch = createMappingDecorator(RequestMethod.PATCH);

/**
 * Route handler (method) Decorator. Routes HTTP OPTIONS requests to the specified path.
 *
 * @publicApi
 */
export const Options = createMappingDecorator(RequestMethod.OPTIONS);

/**
 * Route handler (method) Decorator. Routes HTTP HEAD requests to the specified path.
 *
 * @publicApi
 */
export const Head = createMappingDecorator(RequestMethod.HEAD);

/**
 * Route handler (method) Decorator. Routes all HTTP requests to the specified path.
 *
 * @publicApi
 */
export const All = createMappingDecorator(RequestMethod.ALL);

/**
 * Route handler (method) Decorator. Routes HTTP SEARCH requests to the specified path.
 *
 * @publicApi
 */
export const Search = createMappingDecorator(RequestMethod.SEARCH);
