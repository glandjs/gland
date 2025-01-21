import { describe, it, beforeEach, afterEach, after } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { RuleAction } from '../../../dist/validator/RuleAction';
import { FieldValidator } from '../../../dist/validator/FieldValidator';
import { DefaultMessages } from '../../../dist/validator/config';
import { ValidationField } from '../../../dist/common/interfaces';

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

  // General use case: Validates a simple required field
  it('should return no errors when all rules pass', async () => {
    ruleActionStub.returns(true);

    const result = await FieldValidator.validateField('validValue', { rules: ['required'], options: {} }, 'testField', false, {});

    expect(result).to.be.empty;
  });

  // General use case: Fails on a single rule
  it('should return an error when a rule fails', async () => {
    ruleActionStub.withArgs({ ruleName: 'required' }, undefined).returns(false);

    const result = await FieldValidator.validateField(undefined, { rules: ['required'], options: {} }, 'testField', false, {});

    expect(result).to.deep.equal(['The testField field is required and cannot be left blank.']);
  });

  // Edge case: Inherits default rules
  it('should apply inherited default rules', async () => {
    ruleActionStub.withArgs({ ruleName: 'min', param: '5' }, '123').returns(false);

    const result = await FieldValidator.validateField(
      '123',
      { rules: ['inherit'], options: {} },
      'testField',
      false,
      {},
      ['min:5'], // Default rules
    );

    expect(result).to.deep.equal([DefaultMessages.min?.replace('{value}', '5').replace('{field}', 'testField')]);
  });

  // Unique case: Validates custom function
  it('should return an error when custom validation fails', async () => {
    const customStub = sinon.stub().resolves(false);

    const result = await FieldValidator.validateField('value', { rules: [], options: { custom: customStub }, messages: { custom: 'Custom error message' } }, 'testField', false, {});

    expect(result).to.deep.equal(['Custom error message']);
    sinon.assert.calledOnce(customStub);
  });

  // General use case: Validates multiple rules
  it('should validate multiple rules and return all errors when `returnFirstError` is false', async () => {
    ruleActionStub.withArgs({ ruleName: 'required' }, '').returns(false);
    ruleActionStub.withArgs({ ruleName: 'min', param: '5' }, '').returns(false);

    const result = await FieldValidator.validateField('', { rules: ['required', 'min:5'], options: {} }, 'testField', false, {});

    expect(result).to.deep.equal([DefaultMessages.required?.replace('{field}', 'testField'), DefaultMessages.min?.replace('{value}', '5')?.replace('{field}', 'testField')]);
  });

  // Edge case: Stops validation on the first error
  it('should stop on the first error when `returnFirstError` is true', async () => {
    ruleActionStub.withArgs({ ruleName: 'required' }, '').returns(false);

    const result = await FieldValidator.validateField('', { rules: ['required', 'min:5'], options: {} }, 'testField', true, {});

    expect(result).to.deep.equal([DefaultMessages.required?.replace('{field}', 'testField')]);
  });

  describe('FieldValidator', () => {
    describe('General Use Cases', () => {
      it('should return an error for missing required value', async () => {
        const value = '';
        const fieldRules: ValidationField = { rules: ['required'] };
        const result = await FieldValidator.validateField(value, fieldRules, 'testField', false, {});
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.equal(DefaultMessages.required?.replace('{field}', 'testField'));
      });

      it('should return an error for values outside min or max range', async () => {
        const value = 3;
        const fieldRules: ValidationField = { rules: ['min:5'] };
        const result = await FieldValidator.validateField(value, fieldRules, 'testField', false, {});
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.equal(DefaultMessages.min?.replace('{field}', 'testField').replace('{value}', '5'));
      });
    });

    it('should handle empty rules gracefully', async () => {
      const value = 'test';
      const fieldRules: ValidationField = { rules: [] };
      const result = await FieldValidator.validateField(value, fieldRules, 'testField', false, {});
      expect(result).to.be.empty;
    });

    it('should validate custom rules asynchronously', async () => {
      const value = 'test';
      const fieldRules: ValidationField = {
        rules: [],
        options: {
          custom: async (val) => val === 'test',
        },
      };
      const result = await FieldValidator.validateField(value, fieldRules, 'testField', false, {});
      expect(result).to.be.empty;
    });

    it('should return an error for failed custom validation', async () => {
      const value = 'invalid';
      const fieldRules: ValidationField = {
        rules: [],
        options: {
          custom: async (val) => val === 'test',
        },
        messages: {
          custom: 'Custom validation failed for {field}.',
        },
      };
      const result = await FieldValidator.validateField(value, fieldRules, 'testField', false, {});
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.equal('Custom validation failed for testField.');
    });

    it('should handle dependent field validation', async () => {
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
      const result = await FieldValidator.validateField(value, fieldRules, 'testField', false, allData);
      expect(result).to.be.empty;
    });

    it('should return an error for failed dependent field validation', async () => {
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
      const result = await FieldValidator.validateField(value, fieldRules, 'testField', false, allData);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.equal('testField requires parentField to have a specific value.');
    });

    describe('Return First Error Mode', () => {
      it('should return only the first error when returnFirstError is true', async () => {
        const value = '';
        const fieldRules: ValidationField = { rules: ['required', 'string'] };
        const result = await FieldValidator.validateField(value, fieldRules, 'testField', true, {});
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.equal(DefaultMessages.required?.replace('{field}', 'testField'));
      });

      it('should return all errors when returnFirstError is false', async () => {
        const value = '';
        const fieldRules: ValidationField = { rules: ['required', 'string'] };
        const result = await FieldValidator.validateField(value, fieldRules, 'testField', false, {});
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.equal(DefaultMessages.required?.replace('{field}', 'testField'));
        expect(result[1]).to.equal(DefaultMessages.string?.replace('{field}', 'testField'));
      });
    });
  });
});
