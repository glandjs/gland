import { describe, it, beforeEach, afterEach, after } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { RuleAction } from '../../../packages/validators/actions/rule-action';
import { FieldValidator } from '../../../packages/validators/validators/field-validator';
import { DefaultMessages } from '../../../packages/validators/utils';
import { ValidationField } from '../../../packages/validators/interface/validator.interface';

describe('FieldValidator.validateField', () => {
  let ruleActionStub: sinon.SinonStub;

  beforeEach(() => {
    ruleActionStub = sinon.stub(RuleAction, 'applyRule');
  });

  afterEach(() => {
    ruleActionStub.restore();
    ruleActionStub.reset();
  });
  after(() => {
    sinon.restore();
  });

  it('should return no errors when all rules pass', () => {
    ruleActionStub.returns(true);

    const result = FieldValidator.validateField('validValue', { rules: ['required'], options: {} }, 'testField', false, {});

    expect(result).to.be.empty;
  });

  it('should return an error when a rule fails', () => {
    ruleActionStub.withArgs({ ruleName: 'required' }, undefined).returns(false);

    const result = FieldValidator.validateField(undefined, { rules: ['required'], options: {} }, 'testField', false, {});

    expect(result).to.deep.equal(['The testField field is required and cannot be left blank.']);
  });

  it('should apply inherited default rules', () => {
    ruleActionStub.withArgs({ ruleName: 'min', param: '5' }, '123').returns(false);

    const result = FieldValidator.validateField(
      '123',
      { rules: ['inherit'], options: {} },
      'testField',
      false,
      {},
      ['min:5'], // Default rules
    );

    expect(result).to.deep.equal([DefaultMessages.min?.replace('{value}', '5').replace('{field}', 'testField')]);
  });

  it('should return an error when custom validation fails', () => {
    const customStub = sinon.stub().returns(false);

    const result = FieldValidator.validateField('value', { rules: [], options: { custom: customStub }, messages: { custom: 'Custom error message' } }, 'testField', false, {});

    expect(result).to.deep.equal(['Custom error message']);
    sinon.assert.calledOnce(customStub);
  });

  it('should validate multiple rules and return all errors when `returnFirstError` is false', () => {
    ruleActionStub.withArgs({ ruleName: 'required' }, '').returns(false);
    ruleActionStub.withArgs({ ruleName: 'min', param: '5' }, '').returns(false);

    const result = FieldValidator.validateField('', { rules: ['required', 'min:5'], options: {} }, 'testField', false, {});

    expect(result).to.deep.equal([DefaultMessages.required?.replace('{field}', 'testField'), DefaultMessages.min?.replace('{value}', '5')?.replace('{field}', 'testField')]);
  });

  it('should stop on the first error when `returnFirstError` is true', () => {
    ruleActionStub.withArgs({ ruleName: 'required' }, '').returns(false);

    const result = FieldValidator.validateField('', { rules: ['required', 'min:5'], options: {} }, 'testField', true, {});

    expect(result).to.deep.equal([DefaultMessages.required?.replace('{field}', 'testField')]);
  });

  describe('FieldValidator', () => {
    describe('General Use Cases', () => {
      it('should return an error for missing required value', () => {
        const value = '';
        const fieldRules: ValidationField = { rules: ['required'] };
        const result = FieldValidator.validateField(value, fieldRules, 'testField', false, {});
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.equal(DefaultMessages.required?.replace('{field}', 'testField'));
      });

      it('should return an error for values outside min or max range', () => {
        const value = 3;
        const fieldRules: ValidationField = { rules: ['min:5'] };
        const result = FieldValidator.validateField(value, fieldRules, 'testField', false, {});
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.equal(DefaultMessages.min?.replace('{field}', 'testField').replace('{value}', '5'));
      });
    });

    it('should handle empty rules gracefully', () => {
      const value = 'test';
      const fieldRules: ValidationField = { rules: [] };
      const result = FieldValidator.validateField(value, fieldRules, 'testField', false, {});
      expect(result).to.be.empty;
    });

    it('should validate custom rules hronously', () => {
      const value = 'test';
      const fieldRules: ValidationField = {
        rules: [],
        options: {
          custom: (val) => val === 'test',
        },
      };
      const result = FieldValidator.validateField(value, fieldRules, 'testField', false, {});
      expect(result).to.be.empty;
    });

    it('should return an error for failed custom validation', () => {
      const value = 'invalid';
      const fieldRules: ValidationField = {
        rules: [],
        options: {
          custom: (val) => val === 'test',
        },
        messages: {
          custom: 'Custom validation failed for {field}.',
        },
      };
      const result = FieldValidator.validateField(value, fieldRules, 'testField', false, {});
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.equal('Custom validation failed for testField.');
    });

    it('should handle dependent field validation', () => {
      const value = 'child';
      const fieldRules: ValidationField = {
        rules: [],
        options: {
          dependsOn: {
            field: 'parentField',
            operator: 'equal',
            value: 'parent',
          },
        },
        messages: {
          dependsOn: '{field} requires {dependentField} to have a specific value.',
        },
      };
      const allData = { parentField: 'parent' };
      const result = FieldValidator.validateField(value, fieldRules, 'testField', false, allData);
      expect(result).to.be.empty;
    });

    it('should return an error for failed dependent field validation', () => {
      const value = 'child';
      const fieldRules: ValidationField = {
        rules: [],
        options: {
          dependsOn: {
            field: 'parentField',
            operator: 'equal',
            value: 'parent',
          },
        },
        messages: {
          dependsOn: '{field} requires {dependentField} to have a specific value.',
        },
      };
      const allData = { parentField: 'differentValue' };
      const result = FieldValidator.validateField(value, fieldRules, 'testField', false, allData);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.equal('testField requires parentField to have a specific value.');
    });

    describe('Return First Error Mode', () => {
      it('should return only the first error when returnFirstError is true', () => {
        const value = '';
        const fieldRules: ValidationField = { rules: ['required', 'string'] };
        const result = FieldValidator.validateField(value, fieldRules, 'testField', true, {});
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.equal(DefaultMessages.required?.replace('{field}', 'testField'));
      });

      it('should return all errors when returnFirstError is false', () => {
        const value = '';
        const fieldRules: ValidationField = { rules: ['required', 'string'] };
        const result = FieldValidator.validateField(value, fieldRules, 'testField', false, {});
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.equal(DefaultMessages.required?.replace('{field}', 'testField'));
        expect(result[1]).to.equal(DefaultMessages.string?.replace('{field}', 'testField'));
      });
    });
  });
});
