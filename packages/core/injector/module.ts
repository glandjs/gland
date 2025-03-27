import { InjectionToken, CryptoUUID } from '@glandjs/common';
import { ApiController, ApiChannel } from '@glandjs/common/types';
import { Constructor } from '@medishn/toolkit';
import { InstanceWrapper } from './instance-wrapper';

export class Module {
  public readonly imports = new Set<Module>();
  public readonly controllers = new Map<InjectionToken, InstanceWrapper<ApiController>>();
  public readonly channels = new Map<InjectionToken, InstanceWrapper<ApiChannel>>();
  public readonly exports = new Set<InjectionToken>();
  private readonly _id: string;
  constructor(
    public readonly token: string,
    public readonly metatype: Constructor,
  ) {
    this._id = CryptoUUID.generate();
  }
  get id(): string {
    return this._id;
  }

  public addImports(imports: Module[]) {
    imports.forEach((imp) => this.imports.add(imp));
  }

  public addController(controller: Constructor, instance?: ApiController): void {
    if (!instance) {
      instance = new controller();
    }

    const wrapper = new InstanceWrapper(controller, controller, instance);

    this.controllers.set(controller, wrapper);
  }

  public addChannel(listener: Constructor, instance?: ApiChannel): void {
    if (!instance) {
      instance = new listener();
    }

    const wrapper = new InstanceWrapper(listener, listener, instance);

    this.channels.set(listener, wrapper);
  }
  public addExport(token: InjectionToken): void {
    this.exports.add(token);
  }
}
