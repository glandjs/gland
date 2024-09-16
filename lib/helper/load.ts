import path from 'path';
import * as fs from 'fs';
import { Router } from '../core/router';
import { getEx } from '../core/decorators';
import { ModuleConfig } from '../types';

export namespace LoadModules {
  export const moduleCache: { [key: string]: any } = {};
  const modules: { [key: string]: any } = {};

  const defaultConfig: ModuleConfig = {
    path: 'router',
    routes: [],
    cache: true,
    watch: false,
  };

  let config: ModuleConfig = defaultConfig;

  /**
   * Load the modules based on the provided configuration.
   */
  export async function load(configFilePath: string) {
    const configFile = path.resolve(configFilePath);
    const fileConfig = await parseConfig(configFile);
    console.log('fileConfig', fileConfig);

    config = { ...defaultConfig, ...fileConfig };

    if (!config.routes.length) {
      throw new Error('No routes specified in the configuration file.');
    }

    const baseDir = path.resolve(config.path);
    const files = config.routes.map((route) => path.join(baseDir, route));
    const BATCH_SIZE = 10;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const fileBatch = files.slice(i, i + BATCH_SIZE);
      const importPromises = fileBatch.map(async (file) => {
        await loadModule(file);
      });
      await Promise.all(importPromises);
    }
    if (config.watch) {
      watch(baseDir, files);
    }

    const exp = getEx();
    Router.init(exp);
    return modules;
  }

  // Parse the configuration file for settings
  export async function parseConfig(configPath: string): Promise<Partial<ModuleConfig>> {
    const config: Partial<ModuleConfig> = {};
    try {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      const configLines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('//'));
      console.log('configLines', configLines, '\n');

      for (const line of configLines) {
        if (line.startsWith('path')) {
          // Safely evaluate the expression using Function
          const expression = line.split('=')[1].trim();
          const evaluatePath = new Function('path', '__dirname', `return ${expression};`);
          config.path = evaluatePath(path, path.dirname(configPath));
        } else if (line.startsWith('router {')) {
          const routeLines = configLines.slice(configLines.indexOf(line) + 1, configLines.indexOf('}')).map((r) => r.split(':')[1].trim().replace(/['";]/g, ''));
          config.routes = routeLines;
        } else if (line.startsWith('cache')) {
          config.cache = Boolean(line.split('=')[1].trim());
        } else if (line.startsWith('watch')) {
          config.watch = Boolean(line.split('=')[1].trim().includes('true'));
        }
      }
    } catch (err: any) {
      throw new Error(`Error reading or parsing config file: ${err.message}`);
    }
    return config;
  }
  export async function importModule(filePath: string) {
    return import(filePath);
  }
  async function loadModule(file: string) {
    const resolvedPath = path.resolve(file);
    if (!config.cache || !moduleCache[resolvedPath]) {
      const moduleExports = await importModule(`${resolvedPath}`);
      moduleCache[resolvedPath] = moduleExports;
    }
    const moduleName = path.basename(resolvedPath, path.extname(resolvedPath));
    modules[moduleName] = moduleCache[resolvedPath];
  }
  function watch(baseDir: string, files: string[]) {
    files.forEach((file) => {
      const resolvedPath = path.resolve(file);
      fs.watch(resolvedPath, (eventType) => {
        if (eventType === 'change') {
          console.log(`File ${file} has changed. Reloading module...`);
          loadModule(file).catch((err) => {
            console.error(`Failed to reload module ${file}: ${err.message}`);
          });
        }
      });
    });

    console.log(`Watching files in directory: ${baseDir}`);
  }
}
