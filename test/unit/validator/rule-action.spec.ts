import { expect } from 'chai';
import sinon, { SinonStubbedInstance } from 'sinon';
import 'mocha';
import { after, describe, it } from 'mocha';
import { RuleAction } from '../../../packages/validators/actions/rule-action';
import { ReflectorMock } from '../../mocks/reflector.mock';
import { VALIDATOR_METADATA } from '../../../packages/common';
describe('RuleAction', () => {
  describe('applyRule', () => {
    it('should validate "alpha" rule correctly', () => {
      // Valid alpha string
      expect(RuleAction.applyRule({ ruleName: 'alpha', param: '' }, 'abc')).to.be.true;
      // Invalid alpha string (contains number)
      expect(RuleAction.applyRule({ ruleName: 'alpha', param: '' }, 'abc123')).to.be.false;
      // Invalid alpha string (contains special characters)
      expect(RuleAction.applyRule({ ruleName: 'alpha', param: '' }, 'abc!@#')).to.be.false;
      // Invalid alpha string (empty string)
      expect(RuleAction.applyRule({ ruleName: 'alpha', param: '' }, '')).to.be.false;
      // Invalid alpha string (null)
      expect(RuleAction.applyRule({ ruleName: 'alpha', param: '' }, null)).to.be.false;
      // Invalid alpha string (undefined)
      expect(RuleAction.applyRule({ ruleName: 'alpha', param: '' }, undefined)).to.be.false;
    });

    it('should validate "alphanumeric" rule correctly', () => {
      // Valid alphanumeric string
      expect(RuleAction.applyRule({ ruleName: 'alphanumeric', param: '' }, 'abc123')).to.be.true;
      // Valid alphanumeric string (upper and lower case)
      expect(RuleAction.applyRule({ ruleName: 'alphanumeric', param: '' }, 'ABC123')).to.be.true;
      // Invalid alphanumeric string (contains special characters)
      expect(RuleAction.applyRule({ ruleName: 'alphanumeric', param: '' }, 'abc!@#')).to.be.false;
      // Invalid alphanumeric string (empty string)
      expect(RuleAction.applyRule({ ruleName: 'alphanumeric', param: '' }, '')).to.be.false;
      // Invalid alphanumeric string (null)
      expect(RuleAction.applyRule({ ruleName: 'alphanumeric', param: '' }, null)).to.be.false;
      // Invalid alphanumeric string (undefined)
      expect(RuleAction.applyRule({ ruleName: 'alphanumeric', param: '' }, undefined)).to.be.false;
    });

    it('should validate "float" rule correctly', () => {
      // Valid float value
      expect(RuleAction.applyRule({ ruleName: 'float', param: '' }, 3.14)).to.be.true;
      // Invalid float (string)
      expect(RuleAction.applyRule({ ruleName: 'float', param: '' }, '3.14')).to.be.false;
      // Invalid float (integer)
      expect(RuleAction.applyRule({ ruleName: 'float', param: '' }, 42)).to.be.false;
      // // Invalid float (null)
      expect(RuleAction.applyRule({ ruleName: 'float', param: '' }, null)).to.be.false;
      // Invalid float (undefined)
      expect(RuleAction.applyRule({ ruleName: 'float', param: '' }, undefined)).to.be.false;
    });
    it('should validate "required" rule correctly', () => {
      expect(RuleAction.applyRule({ ruleName: 'required', param: '' }, 'value')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'required', param: '' }, null)).to.be.false;
      expect(RuleAction.applyRule({ ruleName: 'required', param: '' }, undefined)).to.be.false;
      expect(RuleAction.applyRule({ ruleName: 'required', param: '' }, '')).to.be.false;
    });

    it('should validate "string" rule correctly', () => {
      expect(RuleAction.applyRule({ ruleName: 'string', param: '' }, 'test')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'string', param: '' }, 123)).to.be.false;
      expect(RuleAction.applyRule({ ruleName: 'string', param: '' }, null)).to.be.false;
    });

    it('should validate "integer" rule correctly', () => {
      expect(RuleAction.applyRule({ ruleName: 'integer', param: '' }, 42)).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'integer', param: '' }, 42.5)).to.be.false;
      expect(RuleAction.applyRule({ ruleName: 'integer', param: '' }, '42')).to.be.false;
    });

    it('should validate "min" and "max" rules correctly', () => {
      expect(RuleAction.applyRule({ ruleName: 'min', param: '5' }, 'hello')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'min', param: '5' }, 'hi')).to.be.false;
      expect(RuleAction.applyRule({ ruleName: 'max', param: '5' }, 'hello')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'max', param: '5' }, 'hello world')).to.be.false;
    });
  });

  describe('applyDependencyRule', () => {
    it('should validate "equal" dependency correctly', () => {
      expect(RuleAction.applyDependencyRule({ operator: 'equal', value: 'test' }, 'test')).to.be.true;
      expect(RuleAction.applyDependencyRule({ operator: 'equal', value: 'test' }, 'fail')).to.be.false;
    });

    it('should validate "greaterThan" dependency correctly', () => {
      expect(RuleAction.applyDependencyRule({ operator: 'greaterThan', value: 10 }, `${15}`)).to.be.true;
      expect(RuleAction.applyDependencyRule({ operator: 'greaterThan', value: 10 }, `${5}`)).to.be.false;
    });

    it('should validate "exists" dependency correctly', () => {
      expect(RuleAction.applyDependencyRule({ operator: 'exists' }, 'value')).to.be.true;
      expect(RuleAction.applyDependencyRule({ operator: 'exists' }, undefined as unknown as string)).to.be.false;
    });
  });

  describe('filter', () => {
    let mockReflector: SinonStubbedInstance<ReflectorMock['stub']>;
    let restoreReflector: SinonStubbedInstance<ReflectorMock['restore']>;

    beforeEach(() => {
      const mock = new ReflectorMock();
      mock.setup();
      mockReflector = mock.stub;
      restoreReflector = mock.restore.bind(mock);
    });
    afterEach(() => {
      restoreReflector();
    });
    after(() => {
      restoreReflector();
    });
    it('should filter rules by pick option', () => {
      const mockRules = {
        username: { rules: 'string|min:5|max:20' },
        email: { rules: 'string|email' },
        age: { rules: 'integer|min:18' },
      };

      // Correctly stub getMetadata with the right method name
      mockReflector.getMetadata.withArgs(VALIDATOR_METADATA.RULES_METADATA, sinon.match.any).returns(mockRules);

      class MockSchema {}

      const result = RuleAction.filter<any>(MockSchema, ['username', 'email']);

      expect(result).to.have.keys(['username', 'email']);
      expect(result).to.not.have.key('age');
    });

    it('should filter rules by omit option', () => {
      const mockRules = {
        username: { rules: 'string|min:5|max:20' },
        email: { rules: 'string|email' },
        age: { rules: 'integer|min:18' },
      };
      mockReflector.getMetadata.withArgs('validation:rules', sinon.match.any).returns(mockRules);
      const result = RuleAction.filter<any>(class MockSchema {}, undefined, ['age']);
      expect(result).to.have.keys(['username', 'email']);
    });

    it('should return all rules if no filter options are provided', () => {
      const mockRules = {
        username: { rules: 'string|min:5|max:20' },
        email: { rules: 'string|email' },
        age: { rules: 'integer|min:18' },
      };
      mockReflector.getMetadata.withArgs('validation:rules', sinon.match.any).returns(mockRules);
      const result = RuleAction.filter(class MockSchema {}, undefined, undefined);
      expect(result).to.have.keys(['username', 'email', 'age']);
    });
  });

  describe('etc cases', () => {
    it('should handle empty string with "min" rule', () => {
      expect(RuleAction.applyRule({ ruleName: 'min', param: '0' }, '')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'min', param: '1' }, '')).to.be.false;
    });

    it('should handle null or undefined for rules', () => {
      expect(RuleAction.applyRule({ ruleName: 'required', param: '' }, null)).to.be.false;
      expect(RuleAction.applyRule({ ruleName: 'required', param: '' }, undefined)).to.be.false;
    });
  });
});
