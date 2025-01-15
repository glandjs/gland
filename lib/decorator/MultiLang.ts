import { RouterMetadataKeys } from '../common/enums';
import { MultiLanguageContext } from '../common/interfaces';
import Reflector from '../metadata';

export function MultiLanguage(translations: MultiLanguageContext): MethodDecorator {
  return (target) => {
    Reflector.define(RouterMetadataKeys.MULTI_LANG, translations, target.constructor);
  };
}
