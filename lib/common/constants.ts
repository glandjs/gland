// Router-related constants with type safety
export enum RouterMetadataKeys {
  CONTROLLER_PREFIX = 'router:controller:prefix', // Prefix for all routes in a controller
  ROUTES = 'router:routes', // Stores all routes for a controller
  MULTI_LANG = 'router:multiLang', // Multi-language paths for routes
  TRANSFORM = 'router:transform', // Request transformation metadata
  MIDDLEWARES = 'router:middlewares', // Route-specific middlewares
}

// Utility constants for router
export const RouterUtils = {
  API_PREFIX: '', // Default base path for the application
  MAX_CACHE_SIZE: 1000, // Maximum size for cache or buffer
  MIN_CACHE_SIZE: 0, // Minimum size for cache or buffer
  DEFAULT_LANG: 'en', // Default language for multi-language routes
  PARAMETER: /:([^/]+)/g,
};
