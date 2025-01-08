import { RouterMetadataKeys } from '../../common/constants';
import Reflector from '../../metadata';

export function MultiLang(translations: { [lang: string]: string }): MethodDecorator {
  return (target) => {
    Reflector.define(RouterMetadataKeys.MULTI_LANG, translations, target.constructor);
  };
}
