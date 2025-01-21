import { expect } from 'chai';
import sinon from 'sinon';
import 'mocha';
import { RuleAction } from '../../../dist/validator/RuleAction';
import { describe, it } from 'mocha';
import Reflector from '../../../dist/metadata/';
import { createMockReflector } from '../../mocks/reflector.mock';

describe('RuleAction', () => {
  describe('applyRule', () => {
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

    it('should validate "email" rule correctly', () => {
      expect(RuleAction.applyRule({ ruleName: 'email', param: '' }, 'test@example.com')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'email', param: '' }, 'test.com')).to.be.false;
      expect(RuleAction.applyRule({ ruleName: 'email', param: '' }, '')).to.be.false;
    });

    it('should validate "min" and "max" rules correctly', () => {
      expect(RuleAction.applyRule({ ruleName: 'min', param: '5' }, 'hello')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'min', param: '5' }, 'hi')).to.be.false;
      expect(RuleAction.applyRule({ ruleName: 'max', param: '5' }, 'hello')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'max', param: '5' }, 'hello world')).to.be.false;
    });

    it('should validate "regex" rule correctly', () => {
      expect(RuleAction.applyRule({ ruleName: 'regex', param: '^test$' }, 'test')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'regex', param: '^test$' }, 'fail')).to.be.false;
    });

    it('should validate "url" rule correctly', () => {
      expect(RuleAction.applyRule({ ruleName: 'url', param: '' }, 'http://example.com')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'url', param: '' }, 'invalid-url')).to.be.false;
    });
  });

  describe('applyDependencyRule', () => {
    it('should validate "equal" dependency correctly', () => {
      expect(RuleAction.applyDependencyRule({ operator: 'equal', dependencyValue: 'test' }, 'test')).to.be.true;
      expect(RuleAction.applyDependencyRule({ operator: 'equal', dependencyValue: 'test' }, 'fail')).to.be.false;
    });

    it('should validate "greaterThan" dependency correctly', () => {
      expect(RuleAction.applyDependencyRule({ operator: 'greaterThan', dependencyValue: 10 }, 15)).to.be.true;
      expect(RuleAction.applyDependencyRule({ operator: 'greaterThan', dependencyValue: 10 }, 5)).to.be.false;
    });

    it('should validate "exists" dependency correctly', () => {
      expect(RuleAction.applyDependencyRule({ operator: 'exists' }, 'value')).to.be.true;
      expect(RuleAction.applyDependencyRule({ operator: 'exists' }, undefined)).to.be.false;
    });
  });

  describe('filter', () => {
    let mockReflector: ReturnType<typeof createMockReflector>['mockReflector'];
    let restoreReflector: ReturnType<typeof createMockReflector>['restore'];

    beforeEach(() => {
      const mock = createMockReflector();
      mockReflector = mock.mockReflector;
      restoreReflector = mock.restore;
    });
    afterEach(() => {
      sinon.restore();
      restoreReflector();
    });
    it('should filter rules by pick option', () => {
      const mockRules = {
        username: { rules: 'string|min:5|max:20' },
        email: { rules: 'string|email' },
        age: { rules: 'integer|min:18' },
      };

      (Reflector.get as any).withArgs('validation:rules', sinon.match.any).returns(mockRules);

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
      (Reflector.get as any).withArgs('validation:rules', sinon.match.any).returns(mockRules);
      const result = RuleAction.filter<any>(class MockSchema {}, undefined, ['age']);
      expect(result).to.have.keys(['username', 'email']);
    });

    it('should return all rules if no filter options are provided', () => {
      const mockRules = {
        username: { rules: 'string|min:5|max:20' },
        email: { rules: 'string|email' },
        age: { rules: 'integer|min:18' },
      };
      (Reflector.get as any).withArgs('validation:rules', sinon.match.any).returns(mockRules);
      const result = RuleAction.filter(class MockSchema {}, undefined, undefined);
      expect(result).to.have.keys(['username', 'email', 'age']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string with "min" rule', () => {
      expect(RuleAction.applyRule({ ruleName: 'min', param: '0' }, '')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'min', param: '1' }, '')).to.be.false;
    });

    it('should handle null or undefined for rules', () => {
      expect(RuleAction.applyRule({ ruleName: 'required', param: '' }, null)).to.be.false;
      expect(RuleAction.applyRule({ ruleName: 'required', param: '' }, undefined)).to.be.false;
    });

    it('should validate "regex" rule with complex patterns', () => {
      expect(RuleAction.applyRule({ ruleName: 'regex', param: '^[a-z]{3,5}$' }, 'test')).to.be.true;
      expect(RuleAction.applyRule({ ruleName: 'regex', param: '^[a-z]{3,5}$' }, 'toolong')).to.be.false;
    });
  });
});
