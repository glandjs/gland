import path from 'path';
import { Router } from '../core/router';
import { getEx } from '../core/decorators';
import { ModuleConfig } from '../types';
import * as fs from 'fs';
export namespace LoadModules {
  export const moduleCache: { [key: string]: any } = {};
  const modules: { [key: string]: any } = {};
  const defaultConfig: ModuleConfig = {
    path: 'router',
    recursive: true,
    pattern: '*.ts',
    cacheModules: true,
    logLevel: 'info',
  };

  let config: ModuleConfig = defaultConfig;

  export async function load(confPath: string) {
    const configFile = path.resolve(confPath);
    config = { ...defaultConfig, ...(await parseConfig(configFile)) };
    const baseDir = path.join(path.dirname(configFile), config.path);
    const files = await findModules(baseDir, config.pattern!, config.recursive!);
    const BATCH_SIZE = 10;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const fileBatch = files.slice(i, i + BATCH_SIZE);
      const importPromises = fileBatch.map(async (file) => {
        const resolvedPath = path.resolve(file);
        if (!config.cacheModules || !moduleCache[resolvedPath]) {
          const moduleExports = await importModule(resolvedPath);
          moduleCache[resolvedPath] = moduleExports;
        }
        const moduleName = path.basename(resolvedPath, path.extname(resolvedPath));
        modules[moduleName] = moduleCache[resolvedPath];
      });
      await Promise.all(importPromises);
    }

    const exp = getEx();
    Router.init(exp);
    return modules;
  }

  // Parse the config file with caching support
  export async function parseConfig(configPath: string): Promise<Partial<ModuleConfig>> {
    const configCache: { [key: string]: Partial<ModuleConfig> } = {};
    if (configCache[configPath]) {
      return configCache[configPath];
    }

    const config: Partial<ModuleConfig> = {};
    try {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      if (!content) {
        throw new Error(`Config file at ${configPath} is empty or could not be read.`);
      }

      content.split('\n').forEach((line) => {
        const [key, value] = line.split('=').map((s) => s.trim());
        if (key && value) {
          switch (key) {
            case 'recursive':
            case 'cacheModules':
              config[key] = value === 'true';
              break;
            case 'logLevel':
              config[key] = value as ModuleConfig['logLevel'];
              break;
            case 'path':
            case 'pattern':
              config[key] = value.replace(/['"]/g, '');
              break;
            default:
              throw new Error(`Unknown config key: ${key}`);
          }
        }
      });

      configCache[configPath] = config;
    } catch (err: any) {
      throw new Error(`Error reading or parsing config file: ${err.message}`);
    }
    return config;
  }

  // Queue-based file search with cache and worker thread support for faster searching
  export async function findModules(directory: string, pattern: string, recursive: boolean): Promise<string[]> {
    let fileList: string[] = [];
    const queue: string[] = [directory]; // Use a queue to avoid recursive depth limits
    const fileCache: { [key: string]: boolean } = {};

    while (queue.length) {
      const currentDir = queue.shift()!;
      const files = await fs.promises.readdir(currentDir);

      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(currentDir, file);
          if (fileCache[filePath]) return; // Skip cached files
          fileCache[filePath] = true;

          const stat = await fs.promises.stat(filePath);
          if (stat.isDirectory() && recursive) {
            queue.push(filePath);
          } else if (stat.isFile() && fileMatchesPattern(file, pattern)) {
            fileList.push(filePath);
          }
        }),
      );
    }

    return fileList;
  }
  export async function importModule(filePath: string) {
    return import(filePath);
  }
  export function fileMatchesPattern(fileName: string, pattern: string): boolean {
    const regexPattern = new RegExp(pattern.replace('*', '.*'));
    return regexPattern.test(fileName);
  }
}
