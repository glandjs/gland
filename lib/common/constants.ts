// Router-related constants
export const ROUTER_PREFIX_KEY = 'app:router:prefix'; // Controller-level prefix
export const ROUTER_PATH_KEY = 'app:router:path'; // Route path
export const ROUTER_METHOD_KEY = 'app:router:method'; // HTTP Method
export const ROUTER_HANDLER_KEY = 'app:router:handler'; // Route handler function
export const ROUTER_MIDDLEWARE_KEY = 'app:router:middlewares'; // Middlewares

// Decorator-related constants
export const DECORATOR_ROUTES_KEY = 'app:decorator:routes'; // All route metadata
export const DECORATOR_MIDDLEWARE_KEY = 'app:decorator:middlewares'; // Middleware metadata
export const DECORATOR_PREFIX_KEY = 'app:decorator:prefix'; // Controller prefix
export const DECORATOR_ROUTE_METADATA_KEY = 'app:decorator:route_metadata'; // General route metadata

// Utility constants
export const __BASE_PATH__ = '/'; // Base path for the router
export const __MAX_SIZE__ = 1000; // Max size for caches or buffers
export const __MIN_SIZE__ = 0; // Min size for caches or buffers
export const ROUTE_KEY_GENERATOR = (method: string, path: string) => `${method.toUpperCase()}:${path}`;
