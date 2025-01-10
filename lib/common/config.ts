import { RouterUtils } from './constants';
import { AppConfig, Environment } from './interface/app-settings.interface';

export const defaultConfig: AppConfig = {
  // Application general settings
  app_name: 'GlandMyApp', // Default application name
  app_version: '1.0.0', // Default version
  environment: Environment.DEVELOPMENT, // Default environment: development

  // Paths configuration
  paths: {
    apiPrefix: RouterUtils.API_PREFIX, // Default API prefix for routes
    staticFilesPath: '/public', // Default path for static files
  },
  cache: {
    maxSize: 100,
    policy: 'LRU',
    storage: new Map(),
  },
};
