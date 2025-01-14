import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { IncomingMessage, ServerResponse } from 'http';
import { Context } from '../../../lib/context/Context';
import { HttpStatus } from '../../../lib/common/enums/status.enum';
import { ResponseBody } from '../../../lib/context/Context.interface';
import { Socket } from 'net';
import { Stream } from 'stream';

describe('Context Class', () => {
  let req: IncomingMessage;
  let res: ServerResponse;
  let context: Context;

  beforeEach(() => {
    req = new IncomingMessage(new Socket());
    res = new ServerResponse(req);
    context = new Context(req as unknown as IncomingMessage, res as unknown as ServerResponse);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize the context with req and res', () => {
      expect(context.ctx.req).to.equal(req);
      expect(context.ctx.res).to.equal(res);
    });
  });

  describe('status()', () => {
    it('should return the context after setting the status', () => {
      const statusCode = HttpStatus.NOT_FOUND;

      const result = (context.status = statusCode);

      expect(result).to.equal(context.ctx.res.statusCode);
    });
  });
  describe('Set new Value', () => {
    it('should not overwrite existing properties in the context', () => {
      (context.ctx as any).existingProp = 'existingValue';

      const result = (context.ctx as any).existingProp;

      expect(result).to.equal('existingValue');
    });
  });
  describe('send method', () => {
    it('should send a JSON response correctly', () => {
      const response: ResponseBody = { data: 'Test', status: 'success', statusCode: HttpStatus.OK };

      const setHeaderStub = sinon.stub(res, 'setHeader');
      context.send(response);

      expect(setHeaderStub.calledWith('Content-Type', 'application/json; charset=utf-8')).to.be.true;
      expect(res.statusCode).to.equal(200);
    });
    it('should send a string response with the correct headers', () => {
      const response: ResponseBody = 'Hello, world!';

      const setHeaderStub = sinon.stub(res, 'setHeader');
      const endStub = sinon.stub(res, 'end');

      context.send(response);

      expect(setHeaderStub.calledWith('Content-Type', 'text/plain; charset=utf-8')).to.be.true;
      expect(endStub.calledWith(response, 'utf8')).to.be.true;
    });
    it('should handle a Buffer response correctly', () => {
      const buffer: ResponseBody = Buffer.from('Hello, Buffer!');

      const setHeaderStub = sinon.stub(res, 'setHeader');
      const endStub = sinon.stub(res, 'end');

      context.send(buffer);

      expect(setHeaderStub.calledWith('Content-Type', 'application/octet-stream')).to.be.true;
      expect(endStub.calledWith(buffer)).to.be.true;
    });
    it('should pipe a Stream response correctly', () => {
      const stream: ResponseBody = new Stream.PassThrough();
      sinon.stub(stream, 'pipe');

      const setHeaderStub = sinon.stub(res, 'setHeader');

      context.send(stream);

      expect(setHeaderStub.calledWith('Content-Type', 'application/octet-stream')).to.be.true;
      expect((stream.pipe as sinon.SinonStub).calledWith(res)).to.be.true;
    });
    it('should set the status code for 204 (No Content)', () => {
      context.status = 204;

      const endStub = sinon.stub(res, 'end');

      context.send(null as any);

      expect(endStub.called).to.be.true;
      expect(res.statusCode).to.equal(204);
    });
    it('should set the status code for 304 (Not Modified)', () => {
      sinon.stub(res, 'statusCode').value(304);

      const endStub = sinon.stub(res, 'end');

      context.send(null as any);

      expect(endStub.called).to.be.true;
      expect(res.statusCode).to.equal(304);
    });

    it('should handle HEAD requests without a body', () => {
      req.method = 'HEAD';

      const endStub = sinon.stub(res, 'end');

      context.send('This body should not be sent');

      expect(endStub.calledWith()).to.be.true;
    });

    it('should handle a large JSON payload', () => {
      const largeData = { data: 'x'.repeat(1024 * 1024) };

      const setHeaderStub = sinon.stub(res, 'setHeader');
      const endStub = sinon.stub(res, 'end');

      context.send(largeData);

      expect(setHeaderStub.calledWith('Content-Type', 'application/json; charset=utf-8')).to.be.true;

      expect(endStub.calledWith(JSON.stringify(largeData), 'utf8')).to.be.true;
    });

    it('should set ETag if the response is fresh', () => {
      // Stubbing getHeader for 'ETag'
      sinon.stub(res, 'getHeader').withArgs('ETag').returns('some-etag');

      // Mocking the 'if-none-match' header using Object.defineProperty
      Object.defineProperty(req, 'headers', {
        value: { 'if-none-match': 'some-etag' },
        writable: true, // Ensures we can modify the headers if necessary in the future
        configurable: true, // Allows us to redefine the property
      });

      const endStub = sinon.stub(res, 'end');

      context.send({ data: 'etag test' });

      expect(res.statusCode).to.equal(200);
      expect(res.getHeader('ETag')).to.be.deep.equal('some-etag');
      expect(endStub.called).to.be.true;
    });

    it('should handle a 205 (Reset Content) response', () => {
      context.status = 205;

      const endStub = sinon.stub(res, 'end');

      context.send(null as any);

      expect(endStub.called).to.be.true;
      expect(res.statusCode).to.equal(205);
    });
  });
});
