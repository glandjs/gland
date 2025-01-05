import { expect } from 'chai';
import Reflect from '../../../lib/metadata';
import { describe, it } from 'mocha';

describe('Reflect', function () {
  describe('define()', function () {
    it('should define metadata for a target', function () {
      const target = {};
      const metadataKey = 'key1';
      const metadataValue = 'value1';
      Reflect.define(metadataKey, metadataValue, target);

      const result = Reflect.get(metadataKey, target);
      expect(result).to.equal(metadataValue);
    });

    it('should define metadata with propertyKey for a target', function () {
      const target = {};
      const propertyKey = 'property1';
      const metadataKey = 'key2';
      const metadataValue = 'value2';
      Reflect.define(metadataKey, metadataValue, target, propertyKey);

      const result = Reflect.get(metadataKey, target, propertyKey);
      expect(result).to.equal(metadataValue);
    });
  });

  describe('has()', function () {
    it('should return true if metadata exists for a target', function () {
      const target = {};
      const metadataKey = 'key1';
      const metadataValue = 'value1';
      Reflect.define(metadataKey, metadataValue, target);

      const result = Reflect.has(metadataKey, target);
      expect(result).to.be.true;
    });

    it('should return false if metadata does not exist for a target', function () {
      const target = {};
      const metadataKey = 'nonExistentKey';

      const result = Reflect.has(metadataKey, target);
      expect(result).to.be.false;
    });
  });

  describe('get()', function () {
    it('should retrieve the correct metadata value', function () {
      const target = {};
      const metadataKey = 'key1';
      const metadataValue = 'value1';
      Reflect.define(metadataKey, metadataValue, target);

      const result = Reflect.get(metadataKey, target);
      expect(result).to.equal(metadataValue);
    });

    it('should return undefined if metadata does not exist', function () {
      const target = {};
      const metadataKey = 'nonExistentKey';

      const result = Reflect.get(metadataKey, target);
      expect(result).to.be.undefined;
    });
  });

  describe('delete()', function () {
    it('should delete the correct metadata key', function () {
      const target = {};
      const metadataKey = 'key1';
      const metadataValue = 'value1';
      Reflect.define(metadataKey, metadataValue, target);

      const result = Reflect.delete(metadataKey, target);
      expect(result).to.be.true;

      const checkDeleted = Reflect.has(metadataKey, target);
      expect(checkDeleted).to.be.false;
    });

    it('should return false if the metadata key does not exist', function () {
      const target = {};
      const metadataKey = 'nonExistentKey';

      const result = Reflect.delete(metadataKey, target);
      expect(result).to.be.false;
    });
  });

  describe('clear()', function () {
    it('should clear all metadata for a target', function () {
      const target = {};
      const metadataKey1 = 'key1';
      const metadataValue1 = 'value1';
      const metadataKey2 = 'key2';
      const metadataValue2 = 'value2';

      Reflect.define(metadataKey1, metadataValue1, target);
      Reflect.define(metadataKey2, metadataValue2, target);

      Reflect.clear(target);

      const hasMetadata1 = Reflect.has(metadataKey1, target);
      const hasMetadata2 = Reflect.has(metadataKey2, target);

      expect(hasMetadata1).to.be.false;
      expect(hasMetadata2).to.be.false;
    });
  });

  describe('list()', function () {
    it('should list all metadata for a target', function () {
      const target = {};
      const metadataKey1 = 'key1';
      const metadataValue1 = 'value1';
      const metadataKey2 = 'key2';
      const metadataValue2 = 'value2';

      Reflect.define(metadataKey1, metadataValue1, target);
      Reflect.define(metadataKey2, metadataValue2, target);

      const result = Reflect.list(target);
      expect(result).to.deep.equal(
        new Map([
          [metadataKey1, metadataValue1],
          [metadataKey2, metadataValue2],
        ]),
      );
    });
  });
});
