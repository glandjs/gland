import { RulesList, VALIDATOR_METADATA } from '@gland/common';
import { ValidatorEngine } from '../../../packages/validators';
import { FieldValidator } from '../../../packages/validators/validators/field-validator';
import { expect } from 'chai';
import sinon from 'sinon';
import { ReflectorMock } from '../../mocks';
import { ConditionEvaluator } from '../../../packages/validators/validators/condition-evaluator';

describe('ValidatorEngine', () => {
  let reflectorMock: ReflectorMock;
  let getMetadataStub: sinon.SinonStub;

  beforeEach(() => {
    reflectorMock = new ReflectorMock();
    reflectorMock.setup();
    getMetadataStub = reflectorMock.stub.getMetadata;
  });

  afterEach(() => {
    reflectorMock.restore();
  });

  describe('validate', () => {
    it('should return no errors for valid data', () => {
      class TestSchema {}
      const data = { body: { username: 'john', email: 'test@test.com', password: 'secure' } };

      // Mock schema metadata
      getMetadataStub.withArgs(VALIDATOR_METADATA.NESTED_SCHEMA_METADATA, TestSchema).returns({});
      getMetadataStub.withArgs(VALIDATOR_METADATA.RULES_METADATA, TestSchema).returns({
        username: { rules: ['required', 'min:3'] },
        email: { rules: ['required', 'email'] },
        password: { rules: ['required', 'min:6'] },
      });
      getMetadataStub.withArgs(VALIDATOR_METADATA.SCHEMA_SECTION_METADATA, TestSchema).returns('body');

      const errors = ValidatorEngine.validate(TestSchema, data);
      expect(errors).to.be.empty;
    });
    it('should return errors for invalid data', () => {
      class TestSchema {}
      const data = { body: { username: 'jo', email: 'invalid', password: 'short' } };

      // Mock schema metadata
      getMetadataStub.withArgs(VALIDATOR_METADATA.NESTED_SCHEMA_METADATA, TestSchema).returns({ body: { schemaClass: TestSchema, options: {} } });
      getMetadataStub.withArgs(VALIDATOR_METADATA.RULES_METADATA, TestSchema).returns({
        username: { rules: ['required', 'min:3'] },
        email: { rules: ['required', 'string'] },
        password: { rules: ['required', 'min:8'] },
      });
      getMetadataStub.withArgs(VALIDATOR_METADATA.SCHEMA_SECTION_METADATA, TestSchema).returns('body');

      const errors = ValidatorEngine.validate(TestSchema, data);
      expect(errors.body).to.have.keys(['username', 'password']);
    });
    it('should validate data with correct schema and return no errors', () => {
      class TestSchema {
        username: RulesList = ['alpha', 'required', 'min:3', 'max:30'];
      }
      getMetadataStub.withArgs(VALIDATOR_METADATA.NESTED_SCHEMA_METADATA, TestSchema).returns({ body: { schemaClass: TestSchema, options: {} } });

      getMetadataStub.withArgs(VALIDATOR_METADATA.RULES_METADATA, TestSchema).returns({
        username: { rules: ['alpha', 'required', 'min:3', 'max:30'], messages: {}, options: {} },
      });
      getMetadataStub.withArgs(VALIDATOR_METADATA.SCHEMA_SECTION_METADATA, TestSchema).returns('body');

      const data = { body: { username: 'validName' } };
      const errors = ValidatorEngine.validate(TestSchema, data);

      expect(errors).to.deep.equal({});
    });
    it('should return validation errors for invalid data', () => {
      class TestSchema {
        username: RulesList = ['alpha', 'required', 'min:3'];
      }
      getMetadataStub.withArgs(VALIDATOR_METADATA.NESTED_SCHEMA_METADATA, TestSchema).returns({ body: { schemaClass: TestSchema, options: {} } });

      getMetadataStub.withArgs(VALIDATOR_METADATA.RULES_METADATA, TestSchema).returns({
        username: { rules: ['alpha', 'required', 'min:3'], messages: {}, options: {} },
      });

      getMetadataStub.withArgs(VALIDATOR_METADATA.SCHEMA_SECTION_METADATA, TestSchema).returns('body');

      const data = { body: { username: '12' } };
      const errors = ValidatorEngine.validate(TestSchema, data);

      expect(errors).to.deep.equal({
        body: {
          username: ['The username field must contain only alphabetic characters (A-Z, a-z).', 'The username field must have a value of at least 3.'],
        },
      });
    });
    it('should validate a schema and return no errors for valid data', () => {
      const schemaClass = class {};
      const data = { field: 'validValue' };

      // Mock Reflector for schema registry
      getMetadataStub.withArgs(sinon.match.any, schemaClass).returns({
        field: {
          schemaClass,
          options: {},
        },
      });

      // Mock FieldValidator
      sinon.stub(FieldValidator, 'validateField').returns([]);

      const errors = ValidatorEngine.validate(schemaClass, data);

      expect(errors).to.deep.equal({});
      sinon.assert.calledOnce(FieldValidator.validateField as any);
    });

    it('should return no errors for valid data', () => {
      getMetadataStub.withArgs(VALIDATOR_METADATA.RULES_METADATA).returns({
        username: { rules: ['required', 'alpha', 'min:3', 'max:30'] },
        email: { rules: ['required', 'string'] },
        password: { rules: ['required', 'min:8'] },
      });
      getMetadataStub.withArgs(VALIDATOR_METADATA.SCHEMA_SECTION_METADATA).returns('body');

      const schemaClass = class {};
      const data = {
        body: {
          username: 'johnDoe',
          email: 'john.doe@example.com',
          password: 'securePass123',
        },
      };

      sinon.stub(FieldValidator, 'validateField').returns([]);

      const errors = ValidatorEngine.validate(schemaClass, data);

      expect(errors).to.deep.equal({});
    });

    it('should throw an error if both pick and omit options are provided', () => {
      const schemaClass = class {};
      const data = {};

      // Mock Reflector for schema registry
      getMetadataStub.withArgs(sinon.match.any, schemaClass).returns({
        field: {
          schemaClass,
          options: { pick: ['field1'], omit: ['field2'] },
        },
      });

      expect(() => ValidatorEngine.validate(schemaClass, data)).to.throw("Conflict: 'pick' and 'omit' cannot be used together");
    });

    it('should handle conditional validation logic', () => {
      const schemaClass = class {};
      const data = { field: 'value' };

      // Mock ConditionEvaluator
      const conditionStub = sinon.stub(ConditionEvaluator, 'process').returns(new Set());

      ValidatorEngine.validate(schemaClass, data);

      sinon.assert.calledOnce(conditionStub);
    });
  });
});
