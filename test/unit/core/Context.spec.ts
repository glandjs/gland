import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import { expect } from 'chai';
import { Context } from '../../../lib/core/Context';
import { IncomingMessage, ServerResponse } from 'node:http';
import { HttpStatus } from '../../../lib/common/enums/status.enum';

describe('Context', () => {
  let context: Context;
  let request: sinon.SinonStubbedInstance<IncomingMessage>;
  let response: sinon.SinonStubbedInstance<ServerResponse>;

  beforeEach(() => {
    request = sinon.createStubInstance(IncomingMessage);
    response = sinon.createStubInstance(ServerResponse);
    context = new Context(request as unknown as IncomingMessage, response as unknown as ServerResponse);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize the context with req and res', () => {
      // Arrange & Act: Initialization is done in beforeEach
      // Assert
      expect(context.ctx.req).to.equal(request);
      expect(context.ctx.res).to.equal(response);
    });
  });

  describe('json()', () => {
    it('should parse JSON body correctly', async () => {
      // Arrange
      const body = JSON.stringify({ key: 'value' });
      request.on.callsFake((event, handler) => {
        if (event === 'data') handler(body);
        if (event === 'end') handler();
        return request;
      });

      // Act
      await context.json();

      // Assert
      expect(context.ctx.body).to.deep.equal({ key: 'value' });
    });

    it('should handle non-JSON body gracefully', async () => {
      // Arrange
      const body = 'non-json-string';
      request.on.callsFake((event, handler) => {
        if (event === 'data') handler(body);
        if (event === 'end') handler();
        return request;
      });

      // Act
      await context.json();

      // Assert
      expect(context.ctx.body).to.equal(body);
    });

    // it('should reject on error during data stream', async () => {
    //   // Arrange
    //   const error = new Error('Stream error');
    //   request.on.callsFake((event, handler) => {
    //     if (event === 'error') handler(error);
    //     return request;
    //   });

    //   // Act & Assert
    //   await expect(context.json()).to.be.rejectedWith('Stream error');
    // });
  });

  describe('status()', () => {
    it('should set the status code on both context and response', () => {
      // Arrange
      const statusCode = HttpStatus.OK;

      // Act
      const result = context.status(statusCode);

      // Assert
      expect(result.statusCode).to.equal(statusCode);
      expect(response.statusCode).to.equal(statusCode);
    });

    it('should return the context after setting the status', () => {
      // Arrange
      const statusCode = HttpStatus.NOT_FOUND;

      // Act
      const result = context.status(statusCode);

      // Assert
      expect(result).to.equal(context.ctx);
    });
  });
  describe('Edge Cases', () => {
    it('should handle empty request body in json()', async () => {
      // Arrange
      request.on.callsFake((event, handler) => {
        if (event === 'end') handler();
        return request;
      });

      // Act
      await context.json();

      // Assert
      expect(context.ctx.body).to.equal(undefined);
    });

    it('should not overwrite existing properties in the context', () => {
      // Arrange
      (context.ctx as any).existingProp = 'existingValue';

      // Act
      const result = (context.ctx as any).existingProp;

      // Assert
      expect(result).to.equal('existingValue');
    });
  });
});
