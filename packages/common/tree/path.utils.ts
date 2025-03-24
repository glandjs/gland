import type { TreeMode } from './tree';

export class PathUtils {
  private splitter: string;
  constructor(mode: TreeMode) {
    this.splitter = mode === 'event' ? ':' : '/';
  }
  split(path: string): string[] {
    let normalized = path
      .trim()
      .replace(new RegExp(`^\\${this.splitter}+`), '')
      .replace(new RegExp(`\\${this.splitter}+$`), '');

    if (normalized === '') {
      return [this.splitter];
    }

    return normalized.split(this.splitter).filter(Boolean);
  }
}
