import { IDManager } from './IDManager';
import { AppConfig } from './interfaces';
import { RouterUtils } from '../utils';
export const defaultConfig: AppConfig = {
  app_name: 'GlandMyApp',
  app_version: '1.0.0',
  environment: 'DEVELOPMENT',
  server_id: IDManager.generateServerId(),

  paths: {
    apiPrefix: RouterUtils.API_PREFIX,
  },
  cache: {
    maxSize: 1000,
    policy: 'LRU',
    storage: new Map(),
  },
  'x-powered-by': true,
  etag: 'weak',
  trust_proxy: true,
};
