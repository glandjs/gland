import { expect } from 'chai';
import sinon from 'sinon';
import Reflector from '../../../lib/metadata/index';
import { TransformContext } from '../../../lib/common/interfaces';
import { Transform } from '../../../lib/decorator/Transform';
import { RouterMetadataKeys } from '../../../lib/common/enums';
import { afterEach, beforeEach, describe, it } from 'mocha';

describe('Decorators - @Transform Decorator', () => {
  let defineSpy: sinon.SinonSpy;

  beforeEach(() => {
    defineSpy = sinon.spy(Reflector, 'define');
  });

  afterEach(() => {
    defineSpy.restore();
  });

  it('should apply transformation function to method metadata', () => {
    const transformFn = (ctx: TransformContext) => {
      if (ctx.body && typeof ctx.body === 'object') {
        ctx.body.transformed = true;
      }
    };
    class ExampleController {
      @Transform(transformFn)
      public handleRequest() {
        console.log('Request handled');
      }
    }

    const metadata = defineSpy.getCall(0).args;
    const target = ExampleController;
    const propertyKey = 'handleRequest';

    expect(metadata[0]).to.equal(RouterMetadataKeys.TRANSFORM);
    expect(metadata[1]).to.equal(transformFn);
    expect(metadata[2]).to.equal(target);
    expect(metadata[3]).to.equal(propertyKey);
  });

  it('should handle empty or undefined TransformContext', () => {
    const transformFn = sinon.spy((ctx: TransformContext) => {
      if (ctx.body) {
        ctx.body.transformed = true;
      }
    });

    class ExampleController {
      @Transform(transformFn)
      public handleRequest() {}
    }

    const ctx: TransformContext = {} as TransformContext;
    transformFn(ctx);

    expect(transformFn.calledOnce).to.be.true;
    expect(ctx.body).to.equal(undefined);
  });

  it('should handle the Transform function with ss() format', () => {
    const transformFn = (ctx: TransformContext) => {
      if (ctx.body) {
        ctx.body.modified = true;
      }
    };

    class ExampleController {
      @Transform(transformFn)
      public handleRequest() {}
    }

    const ctx: TransformContext = {
      body: { original: 'data' },
    };

    transformFn(ctx);

    expect(ctx.body?.modified).to.be.true;
    expect(ctx.body?.original).to.equal('data');
  });

  it('should handle multiple decorators on the same method', () => {
    const transformFn1 = sinon.spy((ctx: TransformContext) => {
      if (ctx.body) {
        ctx.body.transformed1 = true;
      }
    });

    const transformFn2 = sinon.spy((ctx: TransformContext) => {
      if (ctx.body) {
        ctx.body.transformed2 = true;
      }
    });

    class ExampleController {
      @Transform(transformFn1)
      @Transform(transformFn2)
      public handleRequest() {}
    }

    const ctx: TransformContext = {
      body: { original: 'data' },
    };

    transformFn1(ctx);
    transformFn2(ctx);

    expect(ctx.body?.transformed1).to.be.true;
    expect(ctx.body?.transformed2).to.be.true;
    expect(ctx.body?.original).to.equal('data');
  });

  it('should throw error when transformation function is not passed', () => {
    class ExampleController {
      @Transform(null as any)
      public handleRequest() {}
    }

    try {
      Reflector.define(RouterMetadataKeys.TRANSFORM, null, ExampleController, 'handleRequest');
    } catch (error: any) {
      expect(error).to.be.instanceOf(TypeError);
      expect(error.message).to.include('transformFn should be a function');
    }
  });

  it('should handle transformation of deeply nested properties in request body', () => {
    const transformFn = (ctx: TransformContext) => {
      if (ctx.body && ctx.body.user && ctx.body.user.profile) {
        ctx.body.user.profile.updated = true;
      }
    };

    class ExampleController {
      @Transform(transformFn)
      public handleRequest() {}
    }

    const ctx: TransformContext = {
      body: { user: { profile: { name: 'John' } } },
    };

    transformFn(ctx);

    expect(ctx.body?.user.profile.updated).to.be.true;
    expect(ctx.body?.user.profile.name).to.equal('John');
  });
});
