import { RouterUtils } from './constants';
import { AppConfig, Environment } from './interface/app-settings.interface';

export const defaultConfig: AppConfig = {
  // Application general settings
  app_name: 'GlandMyApp', // Default application name
  app_version: '1.0.0', // Default version
  environment: Environment.DEVELOPMENT, // Default environment: development

  // Server configuration
  server: {
    port: 3000, // Default port number for the server
    hostname: 'localhost', // Default hostname
    watch: true, // Enable file watching for live reloads
    https: false, // Default to non-HTTPS server
    proxy: false, // Disable proxy by default
  },

  // Logger configuration
  logger: {
    level: 'info', // Default log level
    prettyPrint: true, // Enable pretty print for logs
  },

  // Paths configuration
  paths: {
    apiPrefix: RouterUtils.API_PREFIX, // Default API prefix for routes
    staticFilesPath: '/public', // Default path for static files
  },

  // Cache configuration
  cache: {
    enabled: true, // Enable caching by default
    options: {},
  },

  // Plugins configuration (empty by default, can be populated dynamically)
  plugins: [],

  // Global application settings
  global_settings: {
    timezone: 'UTC', // Default timezone
    locale: 'en-US', // Default locale for the app
    enableDebug: true, // Enable debug mode by default
  },
};
