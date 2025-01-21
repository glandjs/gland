import { expect } from 'chai';
import sinon from 'sinon';
import { MultiLanguageContext } from '../../../dist/common/interfaces';
import { MultiLanguage } from '../../../dist/decorator';
import { RouterMetadataKeys } from '../../../dist/common/enums';
import { createMockReflector } from '../../mocks/reflector.mock';

describe('Decorators - @MultiLanguage Decorator', () => {
  let mockReflector: ReturnType<typeof createMockReflector>['mockReflector'];
  let restoreReflector: ReturnType<typeof createMockReflector>['restore'];

  let defineStub: sinon.SinonStub;

  beforeEach(() => {
    const mock = createMockReflector();
    mockReflector = mock.mockReflector;
    restoreReflector = mock.restore;
    defineStub = mockReflector.define;
  });

  afterEach(() => {
    restoreReflector();
    sinon.restore();
  });

  it('should register the correct translations with Reflector', () => {
    const translations: MultiLanguageContext = {
      en: '/foo',
      fr: '/bar',
      default: '/foo',
    };

    class TestController {
      @MultiLanguage(translations)
      public handleRequest() {}
    }

    const metadata = defineStub.getCall(0).args;

    expect(metadata[0]).to.equal(RouterMetadataKeys.MULTI_LANGUAGE);
    expect(metadata[1]).to.deep.equal(translations);
    expect(metadata[2]).to.equal(TestController);
  });

  it('should select the correct language based on the "accept-language" header', () => {
    const translations: MultiLanguageContext = {
      en: '/foo',
      fr: '/bar',
      default: '/foo',
    };

    const ctx: any = {
      headers: { 'accept-language': 'fr' },
      end: sinon.spy(),
    };

    class TestController {
      @MultiLanguage(translations)
      public handleRequest(context: any) {
        context.language = translations[context.headers['accept-language']] || translations.default;
        context.end();
      }
    }

    const controller = new TestController();
    controller.handleRequest(ctx);

    expect(ctx.language).to.equal('/bar');
    expect(ctx.end.calledOnce).to.be.true;
  });

  it('should use the default language if "accept-language" is not present', () => {
    const translations: MultiLanguageContext = {
      en: '/foo',
      fr: '/bar',
      default: '/foo',
    };

    const ctx: any = {
      headers: {},
      end: sinon.spy(),
    };

    class TestController {
      @MultiLanguage(translations)
      public handleRequest(context: any) {
        context.language = translations[context.headers['accept-language']] || translations.default;
        context.end();
      }
    }

    const controller = new TestController();
    controller.handleRequest(ctx);

    expect(ctx.language).to.equal('/foo');
    expect(ctx.end.calledOnce).to.be.true;
  });

  it('should select the correct language even if an unknown language is provided in the "accept-language" header', () => {
    const translations: MultiLanguageContext = {
      en: '/foo',
      fr: '/bar',
      default: '/foo',
    };

    const ctx: any = {
      headers: { 'accept-language': 'es' },
      end: sinon.spy(),
    };

    class TestController {
      @MultiLanguage(translations)
      public handleRequest(context: any) {
        context.language = translations[context.headers['accept-language']] || translations.default;
        context.end();
      }
    }

    const controller = new TestController();
    controller.handleRequest(ctx);

    expect(ctx.language).to.equal('/foo');
    expect(ctx.end.calledOnce).to.be.true;
  });
});
