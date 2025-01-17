import { expect } from 'chai';
import sinon from 'sinon';
import Reflector from '../../../dist/metadata/index';
import { Controller } from '../../../dist/decorator/Controller';

describe('Controller Decorator', () => {
  let defineStub: sinon.SinonStub;
  let getStub: sinon.SinonStub;

  beforeEach(() => {
    defineStub = sinon.stub(Reflector, 'define');
    getStub = sinon.stub(Reflector, 'get');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should define the correct prefix with no existing prefix', () => {
    // Simulating no existing prefix
    const target = class {};
    Controller('api')(target);

    // Verify that the correct normalized prefix is stored
    expect(defineStub.calledWithExactly('router:controller:prefix', '/api', target)).to.be.true;
  });

  it('should combine prefixes when an existing prefix is present', () => {
    const target = class {};
    getStub.withArgs('router:controller:prefix', target).returns('/v1');
    Controller('v1')(target);
    Controller('api')(target);

    // Verify that the prefixes are combined correctly
    expect(defineStub.calledWithExactly('router:controller:prefix', '/v1/api', target)).to.be.true;
  });

  it('should normalize the path to start with "/" and remove extra slashes', () => {
    const target = class {};
    Controller('/api/')(target);

    // Verify normalization of '/api/' to '/api'
    expect(defineStub.calledWithExactly('router:controller:prefix', '/api', target)).to.be.true;
  });

  it('should handle empty prefix gracefully', () => {
    const target = class {};
    expect(() => Controller('')(target)).to.throw('Invalid route prefix: "". Prefix cannot be empty or contain invalid characters.');
  });

  it('should throw error for prefix with invalid characters', () => {
    const target = class {};
    expect(() => Controller('{api}')(target)).to.throw('Invalid route prefix: "{api}". Prefix cannot be empty or contain invalid characters.');
  });

  it('should throw error for null prefix', () => {
    const target = class {};
    expect(() => Controller(null as any)(target)).to.throw('Invalid route prefix: "null". Prefix cannot be empty or contain invalid characters.');
  });

  it('should throw error for undefined prefix', () => {
    const target = class {};
    expect(() => Controller(undefined as any)(target)).to.throw('Invalid route prefix: "undefined". Prefix cannot be empty or contain invalid characters.');
  });
  it('should correctly combine controller prefix and route prefix with slashes', () => {
    const target = class {};
    getStub.withArgs('router:controller:prefix', target).returns('/v1');
    Controller('/users/')(target);

    // Verify that the prefix is correctly combined and normalized
    expect(defineStub.calledWithExactly('router:controller:prefix', '/v1/users', target)).to.be.true;
  });

  it('should handle multiple slashes in the prefix', () => {
    const target = class {};
    Controller('/api///v1///')(target);

    // Ensure the prefix is normalized
    expect(defineStub.calledWithExactly('router:controller:prefix', '/api/v1', target)).to.be.true;
  });

  it('should call Reflector.define with the correct normalized prefix', () => {
    const target = class {};
    Controller('/api/v2')(target);

    expect(defineStub.calledOnceWithExactly('router:controller:prefix', '/api/v2', target)).to.be.true;
  });
});
