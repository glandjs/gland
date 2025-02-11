import { Inject, Injectable, Middleware, Module, MODULE_METADATA, MultiLanguage, ROUTER_METADATA } from '@gland/common';
import { expect } from 'chai';
import { describe, it } from 'mocha';
describe('@gland/common/decorator', () => {
  describe('Inject Decorator', () => {
    it('should attach parameter dependency metadata for @Inject', () => {
      const TOKEN = Symbol('TOKEN');
      class Dependency {}
      class TestClass {
        constructor(@Inject(TOKEN) dep: Dependency) {}
      }

      const paramMetadata = Reflect.getMetadata(MODULE_METADATA.PARAM_DEPENDENCIES_METADATA, TestClass);

      expect(paramMetadata).to.be.an('array').that.is.not.empty;
      expect(paramMetadata[0]).to.have.property('index', 0);
      expect(paramMetadata[0]).to.have.property('token', TOKEN);
    });
  });

  describe('Injectable Decorator', () => {
    it('should attach injectable watermark metadata for @Injectable', () => {
      @Injectable()
      class TestService {}
      const injectableMark = Reflect.getMetadata(MODULE_METADATA.INJECTABLE_WATERMARK, TestService);
      expect(injectableMark).to.be.true;
    });
  });

  describe('Middleware Decorator', () => {
    it('should attach middleware metadata for @Middleware', () => {
      const dummyMiddleware = () => {};
      @Middleware(dummyMiddleware)
      class DummyMiddlewareClass {}
      const middlewares = Reflect.getMetadata(ROUTER_METADATA.MIDDLEWARES_METADATA, DummyMiddlewareClass);
      expect(middlewares).to.be.an('array').that.includes(dummyMiddleware);
    });
  });

  describe('MultiLanguage Decorator', () => {
    it('should attach multi language metadata for @MultiLanguage', () => {
      const translations = { en: 'Hello', fr: 'Bonjour', default: 'en' };
      class TestController {
        @MultiLanguage(translations)
        public greet(): void {}
      }

      const mlMetadata = Reflect.getMetadata(ROUTER_METADATA.MULTI_LANGUAGE_METADATA, TestController);
      expect(mlMetadata).to.deep.equal(translations);
    });
  });

  describe('Module Decorator', () => {
    it('should attach module metadata for @Module', () => {
      const moduleMetadata = {
        controllers: [],
        providers: [],
        imports: [],
        exports: [],
        middlewares: [],
      };
      @Module(moduleMetadata)
      class TestModule {}
      const watermark = Reflect.getMetadata(MODULE_METADATA.MODULE_METADATA_WATERMARK, TestModule);
      const meta = Reflect.getMetadata(MODULE_METADATA.MODULE_METADATA, TestModule);
      expect(watermark).to.be.true;
      expect(meta).to.deep.equal(moduleMetadata);
    });
  });
});
