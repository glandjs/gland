import { Dictionary, merge } from '@medishn/toolkit';

export class Context {
  private _state: Dictionary<any> = {};
  private _error?: unknown;

  constructor() {}

  get state(): Dictionary<any> {
    return { ...this._state };
  }

  set state(data: Dictionary<any>) {
    this._state = merge(this._state, data).value;
  }
  get error(): unknown {
    return this._error;
  }

  set error(err: unknown) {
    this._error = err;
  }
}
