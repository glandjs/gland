export enum EventType {
  SERVER_START = 'server:start',
  SERVER_READY = 'server:ready',
  SERVER_STOP = 'server:stop',
  SERVER_ERROR = 'server:error',
  SERVER_RESTART = 'server:restart',
  SERVER_HEALTH_CHECK = 'server:health-check',

  REQUEST_START = 'request:start',
  REQUEST_END = 'request:end',
  REQUEST_ERROR = 'request:error',
  REQUEST_TIMEOUT = 'request:timeout',
  REQUEST_ABORTED = 'request:aborted',

  RESPONSE_START = 'response:start',
  RESPONSE_END = 'response:end',
  RESPONSE_ERROR = 'response:error',

  ROUTE_MATCHED = 'route:matched',
  ROUTE_NOT_FOUND = 'route:not-found',
  ROUTE_ERROR = 'route:error',
  ROUTE_GUARD_CHECK = 'route:guard-check',
  ROUTE_MIDDLEWARE_EXECUTION = 'route:middleware-execution',
  ROUTE_HANDLER_EXECUTION = 'route:handler-execution',

  APP_BOOTSTRAP = 'app:bootstrap',
  APP_READY = 'app:ready',
  APP_SHUTDOWN = 'app:shutdown',

  WEBSOCKET_CONNECTED = 'websocket:connected',
  WEBSOCKET_DISCONNECTED = 'websocket:disconnected',
  WEBSOCKET_MESSAGE = 'websocket:message',

  ERROR = 'error',
}
