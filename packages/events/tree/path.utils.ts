export class PathUtils {
  private splitter: string = ':';
  constructor() {}
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
