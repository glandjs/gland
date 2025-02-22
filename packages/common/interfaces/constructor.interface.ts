export interface Constructor<T = any> extends Function {
  new (...args: any[]): T;
}
