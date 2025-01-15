import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { MiddlewareStack } from '../../../dist/middleware';
import { ServerRequest } from '../../../dist/common/interfaces';
import { MiddlewareFn } from '../../../dist/common/types';

describe('MiddlewareStack', () => {
  let middleware: MiddlewareStack;
  let ctx: ServerRequest;
  let actionStub: sinon.SinonStub;

  beforeEach(() => {
    middleware = new MiddlewareStack();
    ctx = {} as ServerRequest;
    actionStub = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('push()', () => {
    it('should add middlewares to the stack', () => {
      // Arrange
      const mw1: MiddlewareFn = sinon.stub();
      const mw2: MiddlewareFn = sinon.stub();

      // Act
      middleware.use(mw1, mw2);

      // Assert
      expect(middleware.getStack()).to.deep.equal([mw1, mw2]);
    });

    it('should throw an error if non-function middleware is added', () => {
      // Arrange
      const invalidMw: any = null;

      // Act & Assert
      expect(() => middleware.use(invalidMw)).to.throw('Invalid middleware provided. Each middleware must be a function.');
    });
  });

  describe('execute()', () => {
    it('should execute middlewares in order and then the action', async () => {
      // Arrange
      const mw1: MiddlewareFn = sinon.stub().callsFake(async (ctx, next) => {
        (ctx as any).mw1 = true;
        await next();
      });
      const mw2: MiddlewareFn = sinon.stub().callsFake(async (ctx, next) => {
        (ctx as any).mw2 = true;
        await next();
      });

      middleware.use(mw1, mw2);

      // Act
      await middleware.execute(ctx, actionStub);

      // Assert
      expect(ctx).to.have.property('mw1', true);
      expect(ctx).to.have.property('mw2', true);
      expect(actionStub.calledOnce).to.be.true;
    });

    it('should skip remaining middlewares if `next()` is not called', async () => {
      // Arrange
      const mw1: MiddlewareFn = sinon.stub().callsFake(async (ctx, next) => {
        (ctx as any).mw1 = true;
        // Intentionally not calling next()
      });
      const mw2: MiddlewareFn = sinon.stub().callsFake(async (ctx, next) => {
        (ctx as any).mw2 = true;
        await next();
      });

      middleware.use(mw1, mw2);

      // Act
      await middleware.execute(ctx, actionStub);

      // Assert
      expect(ctx).to.have.property('mw1', true);
      expect(ctx).to.not.have.property('mw2');
      expect(actionStub.called).to.be.false;
    });

    it('should execute the action if no middleware is present', async () => {
      // Act
      await middleware.execute(ctx, actionStub);

      // Assert
      expect(actionStub.calledOnce).to.be.true;
    });

    it('should handle errors thrown by a middleware and propagate them', async () => {
      // Arrange
      const error = new Error('Middleware error');
      const mw1: MiddlewareFn = sinon.stub().callsFake(async () => {
        throw error;
      });
      const mw2: MiddlewareFn = sinon.stub();

      middleware.use(mw1, mw2);

      // Act & Assert
      try {
        await middleware.execute(ctx, actionStub);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.equal(error);
        expect((mw2 as any).called).to.be.false;
        expect(actionStub.called).to.be.false;
      }
    });

    it('should handle errors thrown by the action and propagate them', async () => {
      // Arrange
      const error = new Error('Action error');
      const mw1: MiddlewareFn = sinon.stub().callsFake(async (ctx, next) => {
        await next();
      });
      actionStub.rejects(error);

      middleware.use(mw1);

      // Act & Assert
      try {
        await middleware.execute(ctx, actionStub);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });

    it('should call `next()` for each middleware and action', async () => {
      // Arrange
      const mw1: MiddlewareFn = sinon.stub().callsFake(async (ctx, next) => {
        await next();
      });
      const mw2: MiddlewareFn = sinon.stub().callsFake(async (ctx, next) => {
        await next();
      });

      middleware.use(mw1, mw2);

      // Act
      await middleware.execute(ctx, actionStub);

      // Assert
      expect((mw1 as any).calledOnce).to.be.true;
      expect((mw2 as any).calledOnce).to.be.true;
      expect(actionStub.calledOnce).to.be.true;
    });
  });

  describe('getStack()', () => {
    it('should return a copy of the middleware stack', () => {
      // Arrange
      const mw1: MiddlewareFn = sinon.stub();
      const mw2: MiddlewareFn = sinon.stub();
      middleware.use(mw1, mw2);

      // Act
      const stack = middleware.getStack();

      // Assert
      expect(stack).to.deep.equal([mw1, mw2]);
      expect(stack).to.not.equal(middleware.getStack()); // Ensure it's a copy
    });

    it('should return an empty array if no middlewares are added', () => {
      // Act
      const stack = middleware.getStack();

      // Assert
      expect(stack).to.deep.equal([]);
    });
  });
});
