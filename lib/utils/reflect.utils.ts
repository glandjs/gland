export function isClass(func: Function): boolean {
  return typeof func === 'function' && /^class\s/.test(Function.prototype.toString.call(func));
}
