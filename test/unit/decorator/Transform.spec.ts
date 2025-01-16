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

    // Simulating a class method decorated with @Transform
    class ExampleController {
      @Transform(transformFn)
      public handleRequest() {}
    }

    // Simulate an empty context being passed to the transform function
    const ctx: TransformContext = {} as TransformContext;
    transformFn(ctx);

    // Verifying that the transformation function handles an empty context gracefully
    expect(transformFn.calledOnce).to.be.true;
    expect(ctx.body).to.equal(undefined); // No body should be set, transformation function should not throw
  });

  it('should handle the Transform function with ss() format', () => {
    const transformFn = (ctx: TransformContext) => {
      if (ctx.body) {
        ctx.body.modified = true;
      }
    };

    // Simulating a class method decorated with @Transform
    class ExampleController {
      @Transform(transformFn)
      public handleRequest() {}
    }

    const ctx: TransformContext = {
      body: { original: 'data' },
    };

    // Apply the transformation function
    transformFn(ctx);

    // Check if the transformation function modifies the body as expected

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

    // Simulating a class method decorated with @Transform twice
    class ExampleController {
      @Transform(transformFn1)
      @Transform(transformFn2)
      public handleRequest() {}
    }

    const ctx: TransformContext = {
      body: { original: 'data' },
    };

    // Apply both transformations
    transformFn1(ctx);
    transformFn2(ctx);

    // Check if both transformations have been applied
    expect(ctx.body?.transformed1).to.be.true;
    expect(ctx.body?.transformed2).to.be.true;
    expect(ctx.body?.original).to.equal('data');
  });

  it('should throw error when transformation function is not passed', () => {
    // Simulating a class method decorated with @Transform but without a function
    class ExampleController {
      @Transform(null as any)
      public handleRequest() {}
    }

    try {
      // Trying to access metadata to test the error
      Reflector.define(RouterMetadataKeys.TRANSFORM, null, ExampleController, 'handleRequest');
    } catch (error: any) {
      expect(error).to.be.instanceOf(TypeError); // Or any error you expect
      expect(error.message).to.include('transformFn should be a function');
    }
  });

  it('should handle transformation of deeply nested properties in request body', () => {
    const transformFn = (ctx: TransformContext) => {
      if (ctx.body && ctx.body.user && ctx.body.user.profile) {
        ctx.body.user.profile.updated = true;
      }
    };

    // Simulating a class method decorated with @Transform
    class ExampleController {
      @Transform(transformFn)
      public handleRequest() {}
    }

    const ctx: TransformContext = {
      body: { user: { profile: { name: 'John' } } },
    };

    // Apply the transformation function
    transformFn(ctx);

    // Check if the nested properties are correctly transformed
    expect(ctx.body?.user.profile.updated).to.be.true;
    expect(ctx.body?.user.profile.name).to.equal('John');
  });
});
