import path from 'path';
import { getEx } from '../core/decorators/index';
import { Router } from '../core/router';
import * as fs from 'fs';
import { createInterface } from 'readline';

export namespace LoadModules {
  const cache: Record<string, string[]> = {};
  const keyword = '@exposed';
  const moduleCache: { [key: string]: any } = {};
  /**
   * Load modules based on the given pattern
   * @param pt Pattern to load files
   */
  export async function load(pt: string) {
    const isPattern = pt.includes('*');
    const baseDir = isPattern ? path.dirname(pt) : path.resolve(pt);
    const pattern = isPattern ? path.basename(pt) : '*';
    const files = await find(baseDir, pattern);
    const importPromises = files.map(async (file) => {
      const resolvedPath = path.resolve(file);
      if (!moduleCache[resolvedPath]) {
        moduleCache[resolvedPath] = import(resolvedPath);
      }
      return moduleCache[resolvedPath];
    });
    // Using Promise.allSettled to ensure all promises are handled
    await Promise.all(importPromises);
    const exp = getEx();
    Router.init(exp);
  }

  /**
   * Find files based on the directory and pattern
   * @param directory Directory to search
   * @param pattern Pattern to match files
   */
  async function find(directory: string, pattern: string): Promise<string[]> {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory does not exist: ${directory}`);
    }
    if (cache[directory]) {
      return cache[directory];
    }

    let fileList: string[] = [];
    const items = await fs.promises.readdir(directory, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(directory, item.name);

      if (item.isDirectory()) {
        const subFiles = await find(fullPath, pattern);
        fileList = fileList.concat(subFiles);
      } else {
        if (matchesPattern(item.name, pattern)) {
          if (await containsKeyword(fullPath)) {
            fileList.push(fullPath);
          }
        }
      }
    }

    cache[directory] = fileList;
    return fileList;
  }
  /**
   * Check if a file name matches the given pattern
   * @param fileName File name to check
   * @param pattern Pattern to match
   */
  function matchesPattern(fileName: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(fileName);
  }

  async function containsKeyword(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let f = false;
      const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
      const rl = createInterface({ input: stream });

      rl.on('line', (line) => {
        if (f) {
          return;
        }
        if (line.includes(keyword)) {
          f = true;
          rl.close();
          stream.destroy();
          resolve(true);
        }
      });

      rl.on('close', () => {
        if (!f) {
          resolve(false);
        }
      });

      rl.on('error', (err) => reject(err));
    });
  }
}
