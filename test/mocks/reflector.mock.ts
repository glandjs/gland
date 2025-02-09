import sinon from 'sinon';
import 'reflect-metadata';
import { MockBase } from './base-mock';
export class ReflectorMock extends MockBase<typeof Reflect> {
  private methods: (keyof typeof Reflect)[] = ['defineMetadata', 'deleteMetadata', 'getMetadata', 'getMetadataKeys', 'hasMetadata', 'metadata'];
  constructor() {
    super(Reflect);
  }
  setup(): void {
    this.createStubs(this.methods);
    // Default stubs
    this.stub.hasMetadata.returns(false);
    this.stub.getMetadata.returns(undefined);
    this.stub.deleteMetadata.returns(false);
    this.stub.getMetadataKeys.returns([]);
  }
  restore(): void {
    this.restoreMethods(this.methods);
    sinon.restore();
  }
}
