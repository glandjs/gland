import { resolve, join, extname } from 'path';
import { existsSync } from 'fs';

export class View {
  name: string;
  root: string | string[];
  defaultEngine: string;
  ext: string;
  path: string | null = null;
  engines: { [ext: string]: (path: string, options: object, callback: (err: Error | null, rendered?: string) => void) => void };

  constructor(name: string, options: { root: string | string[]; defaultEngine: string; engines: { [ext: string]: any } }) {
    this.name = name;
    this.root = options.root;
    this.defaultEngine = options.defaultEngine;
    this.engines = options.engines;

    // Determine file extension
    this.ext = extname(name) || this.defaultEngine;

    // Find the file path
    this.path = this.lookup(name);
  }

  lookup(name: string): string | null {
    const roots = Array.isArray(this.root) ? this.root : [this.root];

    for (const root of roots) {
      const fullPath = resolve(join(root, name + this.ext));
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }

  render(options: object, callback: (err: Error | null, rendered?: string) => void) {
    const engine = this.engines[this.ext];

    if (!engine) {
      return callback(new Error(`No view engine found for extension "${this.ext}"`));
    }

    engine(this.path!, options, callback); // Path is guaranteed to be set by lookup
  }
}
