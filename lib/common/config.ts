import { RouterUtils } from './constants';
import { IDManager } from './IDManager';
import { AppConfig, Environment } from './interface/app-settings.interface';

export const defaultConfig: AppConfig = {
  // Application general settings
  app_name: 'GlandMyApp', // Default application name
  app_version: '1.0.0', // Default version
  environment: Environment.DEVELOPMENT, // Default environment: development
  server_id: IDManager.generateServerId(),
  // Paths configuration
  paths: {
    apiPrefix: RouterUtils.API_PREFIX, // Default API prefix for routes
    staticFilesPath: '/public', // Default path for static files
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
