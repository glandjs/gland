import sinon from 'sinon';
import Reflector from '../../dist/metadata';

export const createMockReflector = () => {
  const mockReflector = {
    define: sinon.stub(),
    has: sinon.stub().returns(false),
    get: sinon.stub().returns(undefined),
    delete: sinon.stub().returns(false),
    clear: sinon.stub(),
    keys: sinon.stub().returns([]),
    list: sinon.stub().returns(null),
    allList: sinon.stub().returns(new Map()),
    getRoutes: sinon.stub().returns([]),
    update: sinon.stub(),
  };

  // Save original methods
  const originalMethods = {
    define: Reflector.define,
    has: Reflector.has,
    get: Reflector.get,
    delete: Reflector.delete,
    clear: Reflector.clear,
    keys: Reflector.keys,
    list: Reflector.list,
    allList: Reflector.allList,
    getRoutes: Reflector.getRoutes,
    update: Reflector.update,
  };

  // Override Reflector
  Object.assign(Reflector, mockReflector);

  const restore = () => {
    Object.assign(Reflector, originalMethods);
    sinon.restore();
  };

  return { mockReflector, restore };
};
