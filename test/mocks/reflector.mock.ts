import sinon from 'sinon';
import Reflector from '../../packages/metadata';
import { MockBase } from './base-mock';
export class ReflectorMock extends MockBase<typeof Reflector> {
  private methods: (keyof typeof Reflector)[] = ['clearMetadata', 'defineMetadata', 'deleteMetadata', 'getMetadata', 'getMetadataKeys', 'hasMetadata', 'listMetadata', 'metadata'];
  constructor() {
    super(Reflector);
  }
  setup(): void {
    this.createStubs(this.methods);
    // Default stubs
    this.stub.hasMetadata.returns(false);
    this.stub.getMetadata.returns(undefined);
    this.stub.deleteMetadata.returns(false);
    this.stub.getMetadataKeys.returns([]);
    this.stub.listMetadata.returns(null);
  }
  restore(): void {
    this.restoreMethods(this.methods);
    sinon.restore();
  }
}
