import { RouterMetadataKeys } from '../common/enums';
import { MultiLanguageContext } from '../common/interfaces';
import Reflector from '../metadata';
/**
 * @module MultiLanguage
 * @description
 * The `@MultiLanguage` decorator is used to register multiple translations for a route.
 * It automatically selects the language based on the 'accept-language' header of the request,
 * providing the correct route or translation for that language.
 *
 * @param {MultiLanguageContext} translations - An object containing language mappings.
 *
 * @example
 * ```typescript
 * import { MultiLanguage } from './decorators/MultiLanguage';
 * import { MultiLanguageContext } from './common/interfaces';
 *
 * class ExampleController {
 *   @MultiLanguage({
 *     en: '/foo',     // English route
 *     fr: '/bar',    // French route
 *     default: '/foo' // Default route
 *   })
 *   public handleRequest(ctx: ServerRequest) {
 *     console.log(`Selected language: ${ctx.language}`);
 *     ctx.end()
 *   }
 * }
 * ```
 */
export function MultiLanguage(translations: MultiLanguageContext): MethodDecorator {
  return (target) => {
    Reflector.define(RouterMetadataKeys.MULTI_LANGUAGE, translations, target.constructor);
  };
}
