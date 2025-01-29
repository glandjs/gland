import { expect } from 'chai';
import sinon from 'sinon';
import ReflectStorage from '../../../packages/metadata/storage/storage-metadata';
import Reflector, { MetadataKey, MetadataTarget } from '../../../packages/metadata';
import { describe } from 'mocha';
import { constructMetadataKey } from '@gland/metadata/utils/metadta.utils';
describe('Reflector', () => {
  let storageInstance: ReflectStorage;

  beforeEach(() => {
    storageInstance = new ReflectStorage();
    (Reflector as any).storage = storageInstance;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Core Metadata Operations', () => {
    const testKey: MetadataKey = 'test:key';
    const testValue = { data: 'value' };
    const testTarget: MetadataTarget = class TestClass {};
    const propertyKey = 'testProperty';
    const parameterIndex = 0;
    it('should define metadata for class', () => {
      const setStub = sinon.stub(storageInstance, 'set');
      Reflector.defineMetadata(testKey, testValue, testTarget);
      const key = constructMetadataKey(testKey, { target: {}, type: 'class' });
      expect(setStub.calledOnceWith(testTarget, key, testValue)).to.be.true;
    });

    it('should define metadata for property', () => {
      const setStub = sinon.stub(storageInstance, 'set');

      Reflector.defineMetadata(testKey, testValue, testTarget, propertyKey);
      const key = constructMetadataKey(testKey, { target: {}, type: 'class' }, 'class');
      expect(setStub.calledOnceWith(testTarget, key));
    });

    it('should define metadata for parameter', () => {
      const setStub = sinon.stub(storageInstance, 'set');
      Reflector.defineMetadata(testKey, testValue, testTarget, propertyKey, parameterIndex);
      const key = constructMetadataKey(testKey, { target: {}, type: 'class' });
      expect(setStub.calledOnceWith(testTarget, key));
    });

    it('should retrieve metadata for class', () => {
      const constructedKey = constructMetadataKey(testKey, { target: {}, type: 'class' });
      const metadataMap = new Map([[constructedKey, testValue]]);

      const getStub = sinon.stub(storageInstance, 'get');
      getStub.withArgs(testTarget).returns(metadataMap);
      const result = Reflector.getMetadata(testKey, testTarget);
      expect(result).to.deep.equal(testValue);
    });

    it('should return undefined for non-existent metadata', () => {
      const metadataMap = new Map();
      const getStub = sinon.stub(storageInstance, 'get');
      getStub.withArgs(testTarget).returns(metadataMap);
      const result = Reflector.getMetadata(testKey, testTarget);
      expect(result).to.be.undefined;
    });

    it('should check metadata existence', () => {
      const constructedKey = constructMetadataKey(testKey, { target: {}, type: 'class' });
      const hasStub = sinon.stub(storageInstance, 'has');

      hasStub.withArgs(testTarget, constructedKey).returns(true);

      const result = Reflector.hasMetadata(testKey, testTarget);

      expect(result).to.be.true;
    });

    it('should delete metadata', () => {
      const constructedKey = constructMetadataKey(testKey, { target: {}, type: 'class' });
      const deleteStub = sinon.stub(storageInstance, 'delete');
      deleteStub.withArgs(testTarget, constructedKey).returns(true);
      const result = Reflector.deleteMetadata(testKey, testTarget);
      expect(result).to.be.true;
    });

    it('should clear all metadata for target', () => {
      const clearStub = sinon.stub(storageInstance, 'clear');
      clearStub.withArgs(testTarget);
      Reflector.clearMetadata(testTarget);
    });
  });

  describe('Decorator Factory', () => {
    it('should handle property decorator', () => {
      class TestClass {
        @Reflector.metadata('prop:key', 'propValue')
        testProperty: string;
      }
      const value = Reflector.getMetadata('prop:key', TestClass.prototype, 'testProperty');
      expect(value).to.equal('propValue');
    });

    it('should handle method decorator', () => {
      class TestClass {
        @Reflector.metadata('method:key', 'methodValue')
        decoratedMethod() {}
      }
      const value = Reflector.getMetadata('method:key', TestClass.prototype, 'decoratedMethod');
      expect(value).to.equal('methodValue');
    });

    it('should handle parameter decorator', () => {
      class TestClass {
        testMethod(@Reflector.metadata('param:key', 'paramValue') param: string) {}
      }
      const value = Reflector.getMetadata('param:key', TestClass.prototype, 'testMethod', 0);
      expect(value).to.equal('paramValue');
    });
  });

  describe('Metadata Listing', () => {
    it('should list all metadata keys for target', () => {
      const testTarget = class TestClass {};
      const key1 = constructMetadataKey('key1', { target: {}, type: 'class' });
      const key2 = constructMetadataKey('key2', { target: {}, type: 'class' }, 'prop');
      const key3 = constructMetadataKey('key3', { target: {}, type: 'class' }, 'prop', 100);
      const metadataMap = new Map([
        [key1, 'value1'],
        [key2, 'value2'],
        [key3, 'value3'],
      ]);
      const getStub = sinon.stub(storageInstance, 'get');
      getStub.withArgs(testTarget).returns(metadataMap);
      const keys = Reflector.getMetadataKeys(testTarget);
      expect(keys).to.have.members(['key1', 'key2', 'key3']);
    });
    it('should filter keys by property', () => {
      const testTarget = class TestClass {};
      const key1 = constructMetadataKey('key1', { target: {}, type: 'class' });
      const key2 = constructMetadataKey('key2', { target: {}, type: 'class' }, 'prop');
      const key3 = constructMetadataKey('key3', { target: {}, type: 'class' }, 'prop', 100);
      const key4 = constructMetadataKey('key4', { target: {}, type: 'class' }, 'prop', 42);
      const metadataMap = new Map([
        [key1, 'value1'],
        [key2, 'value2'],
        [key3, 'value3'],
        [key4, 'value4'],
      ]);
      const getStub = sinon.stub(storageInstance, 'get');
      getStub.withArgs(testTarget).returns(metadataMap);
      const keys = Reflector.getMetadataKeys(testTarget, 'PROPERTY');
      expect(keys).to.have.members(['key3', 'key4']);
    });
    it('should filter keys by parameter index', () => {
      const TestTarget = class {};
      const key1 = constructMetadataKey('key1', { target: {}, type: 'class' }, 'method');
      const key2 = constructMetadataKey('key2', { target: {}, type: 'class' }, 'prop', 200);
      const key3 = constructMetadataKey('key2', { target: {}, type: 'class' }, 'param', 0);
      const metadataMap = new Map([
        [key1, 'value1'],
        [key2, 'value2'],
        [key3, 'value3'],
      ]);
      const getStub = sinon.stub(storageInstance, 'get');
      getStub.withArgs(TestTarget).returns(metadataMap);

      const keys = Reflector.getMetadataKeys(TestTarget, 'METHOD');

      expect(keys).to.have.members(['key1']);
    });
    it('should list all metadata for target', () => {
      const testTarget = class TestClass {};
      const key1 = constructMetadataKey('key1', { target: {}, type: 'class' });
      const key2 = constructMetadataKey('key2', { target: {}, type: 'class' }, 'prop');
      const key3 = constructMetadataKey('key2', { target: {}, type: 'class' }, 'param', 0);
      const metadataMap = new Map([
        [key1, 'value1'],
        [key2, 'value2'],
        [key3, 'value3'],
      ]);
      const getStub = sinon.stub(storageInstance, 'get');
      const listStub = sinon.stub(storageInstance, 'list');
      getStub.withArgs(testTarget).returns(metadataMap);
      listStub.withArgs(testTarget).returns(metadataMap);
      const result = Reflector.listMetadata(testTarget);
      expect(result?.count).to.equal(3);
    });
  });

  describe('Specific uses', () => {
    it('should handle metadata keys as symbols', () => {
      const symbolKey = Symbol('unique:symbol');
      const value = 'symbolValue';
      const target = {};
      Reflector.defineMetadata(symbolKey, value, target);
      const result = Reflector.getMetadata(symbolKey, target);
      expect(result).to.equal(value);
    });
    it('should handle undefined and null metadata values', () => {
      const target = {};
      Reflector.defineMetadata('key:undefined', undefined, target);
      Reflector.defineMetadata('key:null', null, target);
      expect(Reflector.getMetadata('key:undefined', target)).to.be.undefined;
      expect(Reflector.getMetadata('key:null', target)).to.be.null;
    });
    it('should retrieve metadata from the prototype chain', () => {
      class ParentClass {}
      class ChildClass extends ParentClass {}
      Reflector.defineMetadata('key:prototype', 'valueFromParent', ParentClass.prototype);
      const result = Reflector.getMetadata('key:prototype', ChildClass.prototype);
      expect(result).to.equal('valueFromParent');
    });
    it('should allow overriding metadata in the prototype chain', () => {
      class ParentClass {}
      class ChildClass extends ParentClass {}
      Reflector.defineMetadata('key:prototype', 'valueFromParent', ParentClass.prototype);
      Reflector.defineMetadata('key:prototype', 'valueFromChild', ChildClass.prototype);
      const result = Reflector.getMetadata('key:prototype', ChildClass.prototype);
      expect(result).to.equal('valueFromChild');
    });
    it('should support multiple metadata keys on the same target', () => {
      const target = {};
      Reflector.defineMetadata('key:one', 'valueOne', target);
      Reflector.defineMetadata('key:two', 'valueTwo', target);
      expect(Reflector.getMetadata('key:one', target)).to.equal('valueOne');
      expect(Reflector.getMetadata('key:two', target)).to.equal('valueTwo');
    });
    it('should clear metadata for a specific target', () => {
      const target = {};
      Reflector.defineMetadata('key:toClear', 'valueToClear', target);
      Reflector.clearMetadata(target);
      expect(Reflector.getMetadata('key:toClear', target)).to.be.undefined;
    });
    it('should list all metadata keys for a target', () => {
      const target = {};
      Reflector.defineMetadata('key:one', 'valueOne', target);
      Reflector.defineMetadata('key:two', 'valueTwo', target);
      const keys = Reflector.getMetadataKeys(target);
      expect(keys).to.include.members(['key:one', 'key:two']);
    });
    it('should handle key collision in inheritance chains', () => {
      class ParentClass {}
      class ChildClass extends ParentClass {}
      Reflector.defineMetadata('key:collision', 'valueFromParent', ParentClass.prototype);
      Reflector.defineMetadata('key:collision', 'valueFromChild', ChildClass.prototype);
      const parentResult = Reflector.getMetadata('key:collision', ParentClass.prototype);
      const childResult = Reflector.getMetadata('key:collision', ChildClass.prototype);
      expect(parentResult).to.equal('valueFromParent');
      expect(childResult).to.equal('valueFromChild');
    });
    it('should delete metadata for a specific key', () => {
      const target = {};
      Reflector.defineMetadata('key:delete', 'valueToDelete', target);
      const deleteResult = Reflector.deleteMetadata('key:delete', target);
      expect(deleteResult).to.be.true;
      expect(Reflector.getMetadata('key:delete', target)).to.be.undefined;
    });
    it('should differentiate metadata on class vs. instance', () => {
      class TestClass {}
      Reflector.defineMetadata('key:class', 'valueOnClass', TestClass);
      Reflector.defineMetadata('key:instance', 'valueOnInstance', TestClass.prototype);
      const classResult = Reflector.getMetadata('key:class', TestClass);
      const instanceResult = Reflector.getMetadata('key:instance', TestClass.prototype);
      expect(classResult).to.equal('valueOnClass');
      expect(instanceResult).to.equal('valueOnInstance');
    });
    it('should support metadata on method parameters', () => {
      class TestClass {
        method(@Reflector.metadata('key:param', 'valueOnParam') _param: any) {}
      }
      const metadataKeys = Reflector.getMetadataKeys(TestClass.prototype, 'PROPERTY');
      expect(metadataKeys).to.include('key:param');
      expect(Reflector.getMetadata('key:param', TestClass.prototype, 'method', 0)).to.equal('valueOnParam');
    });
    it('should support metadata on static methods', () => {
      class TestClass {
        static staticMethod() {}
      }
      Reflector.defineMetadata('key:static', 'valueOnStaticMethod', TestClass, 'staticMethod');
      const result = Reflector.getMetadata('key:static', TestClass, 'staticMethod');
      expect(result).to.equal('valueOnStaticMethod');
    });
    it('should handle metadata with undefined property keys', () => {
      const target = {};
      Reflector.defineMetadata('key:undefinedProp', 'value', target, undefined);
      const result = Reflector.getMetadata('key:undefinedProp', target, undefined);
      expect(result).to.equal('value');
    });
    it('should list all metadata for a target', () => {
      const target = {};
      Reflector.defineMetadata('key:one', 'valueOne', target);
      Reflector.defineMetadata('key:two', 'valueTwo', target);
      const metadataResult = Reflector.listMetadata(target);
      expect(metadataResult).to.not.be.null;
      expect(metadataResult!.count).to.equal(2);
      expect(metadataResult!.metadata).to.be.an('array').with.lengthOf(2);
      const metadataEntries = metadataResult!.metadata;
      expect(metadataEntries).to.deep.include.members([
        { metadataKey: 'key:one', metadataValue: 'valueOne' },
        { metadataKey: 'key:two', metadataValue: 'valueTwo' },
      ]);
    });
    it('should handle numeric property keys', () => {
      const testTarget = { 42: 'answer' };
      Reflector.defineMetadata('numKey', 'value', testTarget);
      expect(Reflector.hasMetadata('numKey', testTarget)).to.be.true;
    });
  });

  describe('Prototype Chain Scenarios', () => {
    it('should shadow parent metadata with child metadata', () => {
      class Parent {
        method() {}
      }
      class Child extends Parent {
        method() {}
      }

      Reflector.defineMetadata('override', 'parent', Parent.prototype, 'method');
      Reflector.defineMetadata('override', 'child', Child.prototype, 'method');

      expect(Reflector.getMetadata('override', Child.prototype, 'method')).to.equal('child');
    });

    it('should not find metadata on sibling prototypes', () => {
      class Sibling1 {}
      class Sibling2 {}
      Reflector.defineMetadata('siblingKey', 'value', Sibling1.prototype);
      expect(Reflector.hasMetadata('siblingKey', Sibling2.prototype)).to.be.false;
    });
  });

  describe('Parameter Metadata', () => {
    it('should handle multiple parameters in constructor', () => {
      class Test {
        constructor(@Reflector.metadata('param', 0) a: any, @Reflector.metadata('param', 1) b: any) {}
      }
      const param0 = Reflector.getMetadata('param', Test, undefined, 0);
      const param1 = Reflector.getMetadata('param', Test, undefined, 1);
      expect(param0).to.equal(0);
      expect(param1).to.equal(1);
    });
    it('should handle method parameter metadata with symbol method name', () => {
      class Test {
        method(@Reflector.metadata('param', 'value') param: any) {}
      }
      const result = Reflector.getMetadata('param', Test.prototype, Symbol('method'), 0);
      expect(result).to.equal('value');
    });
  });

  describe('Static Members', () => {
    it('should handle static property metadata', () => {
      class Test {
        static staticProp: string;
      }
      Reflector.defineMetadata('staticMeta', 'value', Test, 'staticProp');
      expect(Reflector.hasMetadata('staticMeta', Test, 'staticProp')).to.be.true;
    });

    it('should differentiate between static and instance members', () => {
      class Test {
        instanceMethod() {}
        static staticMethod() {}
      }

      Reflector.defineMetadata('meta', 'instance', Test.prototype, 'instanceMethod');
      Reflector.defineMetadata('meta', 'static', Test, 'staticMethod');

      expect(Reflector.getMetadata('meta', Test.prototype, 'instanceMethod')).to.equal('instance');
      expect(Reflector.getMetadata('meta', Test, 'staticMethod')).to.equal('static');
    });
  });

  describe('Advanced Storage Scenarios', () => {
    it('should handle 1000 metadata entries on single target', () => {
      const testTarget = {};
      for (let i = 0; i < 1000; i++) {
        Reflector.defineMetadata(`key${i}`, i, testTarget);
      }

      expect(Reflector.getMetadataKeys(testTarget).length).to.equal(1000);
      expect(Reflector.getMetadata('key999', testTarget)).to.equal(999);
    });

    it('should maintain metadata when target is frozen', () => {
      const testTarget = Object.freeze({});
      Reflector.defineMetadata('frozen', true, testTarget);
      expect(Reflector.getMetadata('frozen', testTarget)).to.be.true;
    });
  });

  describe('Decorator Handling', () => {
    it('should handle property decorator with undefined descriptor', () => {
      class Test {
        @Reflector.metadata('propMeta', 'value')
        myProp: string;
      }

      expect(Reflector.hasMetadata('propMeta', Test.prototype, 'myProp')).to.be.true;
    });

    it('should handle parameter decorator in abstract class', () => {
      abstract class Abstract {
        abstract method(param: any): void;
      }

      class Concrete extends Abstract {
        @Reflector.metadata('abstractParam', true)
        method(param: any) {}
      }

      const result = Reflector.getMetadata('abstractParam', Concrete.prototype, 'method');
      expect(result).to.be.true;
    });
  });

  describe('Type Safety', () => {
    it('should maintain type information through inheritance', () => {
      interface MetaType {
        version: number;
        tags: string[];
      }

      class Parent {
        @Reflector.metadata<MetaType>('typedMeta', { version: 1, tags: ['parent'] })
        method() {}
      }

      class Child extends Parent {
        @Reflector.metadata<MetaType>('typedMeta', { version: 2, tags: ['child'] })
        method() {}
      }

      const meta = Reflector.getMetadata<MetaType>('typedMeta', Child.prototype, 'method');
      expect(meta).to.deep.equal({ version: 2, tags: ['child'] });
      expect(meta!.tags).to.include('child');
    });
  });

  describe('Error Scenarios', () => {
    it('should return undefined for non-existent metadata key', () => {
      class Test {}
      expect(Reflector.getMetadata('nonExistent', Test)).to.be.undefined;
    });

    it('should handle deletion of non-existent metadata', () => {
      class Test {}
      expect(Reflector.deleteMetadata('nonExistent', Test)).to.be.false;
    });
  });

  describe('Complex Key Structures', () => {
    it('should handle nested parameter indexes', () => {
      class Test {
        method(@Reflector.metadata('deep', 'level1') a: any, @Reflector.metadata('deep', 'level2') b?: any) {
          return (c: any) => {
            Reflector.defineMetadata('deep', 'level3', this, 'method', 2);
          };
        }
      }

      const instance = new Test();
      instance.method(() => {})('example');
      expect(Reflector.getMetadata('deep', instance, 'method', 0)).to.equal('level1');
      expect(Reflector.getMetadata('deep', instance, 'method', 1)).to.equal('level2');
      expect(Reflector.getMetadata('deep', instance, 'method', 2)).to.equal('level3');
    });
  });

  describe('Cross-Target Metadata', () => {
    it('should handle metadata on function targets', () => {
      function testFunction() {}
      Reflector.defineMetadata('fnMeta', true, testFunction);
      expect(Reflector.getMetadata('fnMeta', testFunction)).to.be.true;
    });

    it('should differentiate between instance and prototype metadata', () => {
      class Test {}
      const instance = new Test();

      Reflector.defineMetadata('location', 'prototype', Test.prototype);
      Reflector.defineMetadata('location', 'instance', instance);
      const idx1 = Reflector.getMetadata('location', Test.prototype);
      const idx2 = Reflector.getMetadata('location', instance);
      expect(idx1).to.equal('prototype');
      expect(idx2).to.equal('instance');
    });
  });

  describe('Metadata Key Enumeration', () => {
    it('should handle partial key matches', () => {
      const testTarget = {};
      Reflector.defineMetadata('partial:test', 'a', testTarget);
      Reflector.defineMetadata('partial:match', 'b', testTarget);
      Reflector.defineMetadata('fullmatch', 'c', testTarget);
      const keys = Reflector.getMetadataKeys(testTarget).filter((k) => k.toString().startsWith('partial'));
      expect(keys).to.have.members(['partial:test', 'partial:match']);
    });
  });
});
