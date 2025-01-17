import { expect } from 'chai';
import { describe, it } from 'mocha';
import { RouteNormalizer } from '../../../dist/utils';

describe('RouteNormalizer', () => {
  it('should normalize paths correctly', () => {
    expect(RouteNormalizer.normalizePath('foo')).to.equal('/foo');
    expect(RouteNormalizer.normalizePath('/foo')).to.equal('/foo');
    expect(RouteNormalizer.normalizePath('///foo///bar///')).to.equal('/foo/bar');
  });

  it('should combine paths with controller prefix correctly', () => {
    expect(RouteNormalizer.combinePaths('/api', 'foo')).to.equal('/api/foo');
    expect(RouteNormalizer.combinePaths('/api', '/foo/bar')).to.equal('/api/foo/bar');
    expect(RouteNormalizer.combinePaths(undefined, 'foo')).to.equal('/foo');
  });

  it('should validate methods correctly', () => {
    class TestController {
      static staticMethod() {}
      instanceMethod() {}
    }
    expect(() => RouteNormalizer.validateMethod(TestController, 'staticMethod')).to.throw('Decorators cannot be applied to static methods: staticMethod');
    expect(() => RouteNormalizer.validateMethod(TestController.prototype, 'instanceMethod')).to.not.throw();
  });
});
