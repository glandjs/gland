import { expect } from 'chai';
import Reflect from '../../../lib/metadata';
import { MetadataKey, MetadataValue } from '../../../lib/types';
type TestTarget = object;
const testTarget: TestTarget = {};

describe('Reflect', function () {
  describe('init', function () {
    it('should initialize metadata correctly', function () {
      const metadataKey: MetadataKey = 'key1';
      const metadataValue: MetadataValue = 'value1';

      Reflect.init(metadataKey, metadataValue, testTarget);

      const result = Reflect.get(metadataKey, testTarget);
      expect(result).to.equal(metadataValue);
    });

    it('should initialize metadata with property key', function () {
      const metadataKey: MetadataKey = 'key2';
      const metadataValue: MetadataValue = 'value2';
      const propertyKey: MetadataKey = 'prop1';

      Reflect.init(metadataKey, metadataValue, testTarget, propertyKey);

      const result = Reflect.get(metadataKey, testTarget, propertyKey);
      expect(result).to.equal(metadataValue);
    });
  });

  describe('has', function () {
    it('should return true if metadata exists', function () {
      const metadataKey: MetadataKey = 'key3';
      const metadataValue: MetadataValue = 'value3';

      Reflect.init(metadataKey, metadataValue, testTarget);

      const result = Reflect.has(metadataKey, testTarget);
      expect(result).to.be.true;
    });

    it('should return false if metadata does not exist', function () {
      const metadataKey: MetadataKey = 'key4';

      const result = Reflect.has(metadataKey, testTarget);
      expect(result).to.be.false;
    });
  });

  describe('get', function () {
    it('should return the correct metadata value', function () {
      const metadataKey: MetadataKey = 'key5';
      const metadataValue: MetadataValue = 'value5';

      Reflect.init(metadataKey, metadataValue, testTarget);

      const result = Reflect.get(metadataKey, testTarget);
      expect(result).to.equal(metadataValue);
    });

    it('should return undefined if metadata does not exist', function () {
      const metadataKey: MetadataKey = 'key6';

      const result = Reflect.get(metadataKey, testTarget);
      expect(result).to.be.undefined;
    });

    it('should return the correct metadata value with property key', function () {
      const metadataKey: MetadataKey = 'key7';
      const metadataValue: MetadataValue = 'value7';
      const propertyKey: MetadataKey = 'prop2';

      Reflect.init(metadataKey, metadataValue, testTarget, propertyKey);

      const result = Reflect.get(metadataKey, testTarget, propertyKey);
      expect(result).to.equal(metadataValue);
    });
  });

  describe('getOwn', function () {
    it('should return the correct own metadata value', function () {
      const metadataKey: MetadataKey = 'key8';
      const metadataValue: MetadataValue = 'value8';
      const propertyKey: MetadataKey = 'prop3';

      Reflect.init(metadataKey, metadataValue, testTarget, propertyKey);

      const result = Reflect.getOwn(metadataKey, testTarget, propertyKey);
      expect(result).to.equal(metadataValue);
    });

    it('should return undefined if own metadata does not exist', function () {
      const metadataKey: MetadataKey = 'key9';
      const propertyKey: MetadataKey = 'prop4';

      const result = Reflect.getOwn(metadataKey, testTarget, propertyKey);
      expect(result).to.be.undefined;
    });
  });
});
