import { expect } from 'chai';
import sinon from 'sinon';
import { Constructor } from '../../../dist/common/interfaces';
import { ValidationMetadataKey } from '../../../dist/common/enums';
import { ValidatorProcess } from '../../../dist/validator/Validator';
import { createMockReflector } from '../../mocks/reflector.mock';
import { FieldValidator } from '../../../lib/validator/FieldValidator';
describe('ValidatorProcess', () => {
  let schemaMock: Constructor<any>;
  let nestedSchemasMock: Record<string, any>;
  let mockReflector: ReturnType<typeof createMockReflector>['mockReflector'];
  let restoreReflector: ReturnType<typeof createMockReflector>['restore'];
  let dataMock: Record<string, Record<string, string>>;
  beforeEach(() => {
    schemaMock = class {};
    dataMock = { body: { field1: 'value1', field2: 'value2' } };

    nestedSchemasMock = {
      schema1: {
        schemaClass: schemaMock,
        options: { conditions: [] },
      },
    };
    const mock = createMockReflector();
    mockReflector = mock.mockReflector;
    restoreReflector = mock.restore;
    mockReflector.get.callsFake((key: any, target: any) => {
      if (key === ValidationMetadataKey.NESTED) return nestedSchemasMock;
      if (key === ValidationMetadataKey.RULES) return { field1: { rules: ['required'] } };
      if (key === ValidationMetadataKey.SCHEMA) return { section: 'body', defaultRules: ['required'] };
      return undefined;
    });
    sinon.stub(FieldValidator, 'validateField').callsFake((fieldName, value, rules) => {
      if (fieldName === 'field1' && rules.includes('required') && typeof value === 'string' && value !== '') {
        return Promise.resolve([]);
      }
      return Promise.resolve([`${fieldName} is invalid`]);
    });
  });
  afterEach(() => {
    sinon.restore();
    restoreReflector();
  });

  describe('validate', () => {
    it('should validate a schema and return no errors if all validations pass', async () => {
      const errors = await ValidatorProcess.validate(schemaMock, dataMock);
      expect(errors).to.be.empty;
    });

    it('should return errors if a field fails validation', async () => {
      const errors = await ValidatorProcess.validate(schemaMock, { field1: '' });
      expect(errors).to.have.property('body').that.includes.keys('field1');
      expect(errors.body.field1[0]).to.equal('The field1 field is required and cannot be left blank.');
    });
    it('should skip validation for schemas already validated by conditions', async () => {
      sinon.stub(ValidatorProcess as any, 'validateConditions').resolves(new Set([schemaMock]));
      const validateFieldsForSchemasSpy = sinon.spy(ValidatorProcess as any, 'validateFieldsForSchemas');

      const errors = await ValidatorProcess.validate(schemaMock, dataMock);

      expect(validateFieldsForSchemasSpy.called).to.be.true;
      expect(errors).to.be.empty;
    });
    it('should throw an error if schema options contain both pick and omit', async () => {
      nestedSchemasMock.schema1.options = { pick: ['field1'], omit: ['field2'] };
      const mock = createMockReflector();
      const mockReflector = mock.mockReflector;
      mockReflector.get.withArgs(ValidationMetadataKey.NESTED, schemaMock).returns(nestedSchemasMock);
      try {
        await ValidatorProcess.validate(schemaMock, dataMock);
        expect.fail('Expected error was not thrown');
      } catch (error: any) {
        mock.restore();
        expect(error.message).to.equal("Cannot use both 'pick' and 'omit' options together. Please choose one or the other.");
      }
    });

    it('should validate fields with schema options applied', async () => {
      nestedSchemasMock.schema1.options = { pick: ['field1'] };

      const errors = await ValidatorProcess.validate(schemaMock, { field1: '', field2: 'value2' });
      expect(errors).to.have.property('body').that.includes.keys('field1');
      expect(errors.body.field1[0]).to.equal('The field1 field is required and cannot be left blank.');
    });
  });
});
