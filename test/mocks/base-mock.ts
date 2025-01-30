import { SinonStubbedInstance } from 'sinon';
import sinon from 'sinon';

export interface Mock<T> {
  setup(): void;
  restore(): void;
  reset(): void;
  get stub(): SinonStubbedInstance<T>;
}

export abstract class MockBase<T extends object> implements Mock<T> {
  protected original: Partial<T> = {};
  protected stubs: SinonStubbedInstance<T> = {} as SinonStubbedInstance<T>;
  protected target: any;

  constructor(protected mockTarget: T) {
    this.target = mockTarget;
  }

  abstract setup(): void;
  abstract restore(): void;

  reset(): void {
    Object.values(this.stubs).forEach((stub: any) => {
      if (typeof stub.reset === 'function') stub.reset();
    });
  }

  get stub(): SinonStubbedInstance<T> {
    return this.stubs;
  }

  protected createStubs(methods: Array<keyof T>): void {
    methods.forEach((method) => {
      if (typeof this.mockTarget[method] === 'function') {
        this.original[method] = this.mockTarget[method];
        (this.stubs as any)[method] = sinon.stub(this.target, method as string);
      }
    });
  }
  protected restoreMethods(methods: Array<keyof T>): void {
    methods.forEach((method) => {
      if (this.original[method]) {
        this.target[method] = this.original[method];
      }
    });
  }
}
