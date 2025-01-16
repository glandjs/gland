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
 *     en: '/test',     // English route
 *     fr: '/essai',    // French route
 *     default: '/test' // Default route
 *   })
 *   public handleRequest(ctx: TransformContext) {
 *     console.log(`Selected language: ${ctx.language}`);
 *   }
 * }
 * ```
 */
export function MultiLanguage(translations: MultiLanguageContext): MethodDecorator {
  return (target) => {
    Reflector.define(RouterMetadataKeys.MULTI_LANG, translations, target.constructor);
  };
}
