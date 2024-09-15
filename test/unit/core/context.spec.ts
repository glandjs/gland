import sinon from 'sinon';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { WebContext } from '../../../lib/core/context';
import { IncomingMessage } from 'http';
import { ServerResponse } from 'http';
import { RQ, RS } from '../../../lib/types';
describe('CONTEXT', () => {
  let webContext: WebContext;
  let mockRequest: sinon.SinonStubbedInstance<IncomingMessage & RQ>;
  let mockResponse: sinon.SinonStubbedInstance<ServerResponse & RS>;
  beforeEach(() => {
    mockRequest = sinon.createStubInstance<IncomingMessage & RQ>(IncomingMessage);
    mockResponse = sinon.createStubInstance<ServerResponse & RS>(ServerResponse);
    webContext = new WebContext(mockRequest, mockResponse);
  });

  afterEach(() => {
    sinon.restore();
  });
  it('should initialize the context with default values', () => {
    expect(webContext.body).to.be.null;
    expect(webContext.params).to.deep.equal({});
    expect(webContext.query).to.deep.equal({});
  });
  it('should return response property when accessed via proxy', () => {
    // Mocking a response property (e.g., "statusCode")
    mockResponse.statusCode = 200;

    const statusCode = webContext.ctx.statusCode;

    expect(statusCode).to.equal(200);
  });

  it('should set request or response properties correctly', () => {
    // Setting a response property
    webContext.ctx.statusCode = 404;
    expect(mockResponse.statusCode).to.equal(404);

    // Setting a request property
    webContext.ctx.method = 'POST';
    expect(webContext.ctx.method).to.equal('POST');
  });
  it('should return true if property exists in request or response', () => {
    mockRequest.method = 'GET';
    expect('method' in webContext.ctx).to.be.true;
  });

  it('should return false if property does not exist in request or response', () => {
    expect('nonexistent' in webContext.ctx).to.be.false;
  });

  it('should delete properties from request or response', () => {
    expect(delete webContext.ctx.method).to.be.true;
    expect(webContext.ctx.method).to.be.undefined;
  });
});
