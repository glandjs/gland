import { PATH_METADATA } from '../../constant';

/**
 * Marks a class as an HTTP controller and sets its base route prefix.
 *
 * The prefix is prepended to the path of every `@Get()`/`@Post()`/… handler
 * in the class.
 *
 * @param path - base route prefix; `/` (the default) adds no prefix
 *
 * @example
 * ```ts
 * @Controller('products')
 * export class ProductController {
 *   @Get()            // -> GET /products
 *   list(ctx: Context) {}
 *
 *   @Get(':id')       // -> GET /products/:id
 *   find(ctx: Context) {}
 * }
 * ```
 */
export function Controller(path = '/'): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(PATH_METADATA, path, target);
  };
}
