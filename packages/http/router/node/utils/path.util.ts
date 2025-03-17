export class PathUtils {
  static split(path: string): string[] {
    let normalized = path.trim().replace(/^\/+/, '').replace(/\/+$/, '');

    if (normalized === '' && path !== '') {
      normalized = '/';
    }

    const segments = normalized === '/' ? ['/'] : normalized.split('/').filter((s) => s !== '');
    return segments;
  }

  static findCommonPrefixLength(a: string, b: string): number {
    const minLength = Math.min(a.length, b.length);
    let i = 0;
    for (; i < minLength; i++) {
      if (a.charCodeAt(i) !== b.charCodeAt(i)) {
        break;
      }
    }
    return i;
  }
}
