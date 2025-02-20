export enum EventType {
  SERVER_START = 'server:start',
  SERVER_READY = 'server:ready',
  SERVER_STOP = 'server:stop',
  SERVER_ERROR = 'server:error',

  REQUEST_START = 'request:start',
  REQUEST_END = 'request:end',
  REQUEST_ERROR = 'request:error',

  RESPONSE = 'response',
  RESPONSE_ERROR = 'response:error',

  ROUTE_MATCHED = 'route:matched',
  ROUTE_NOT_FOUND = 'route:not-found',
  ROUTE_ERROR = 'route:error',

  WEBSOCKET_CONNECTED = 'websocket:connected',
  WEBSOCKET_DISCONNECTED = 'websocket:disconnected',
  WEBSOCKET_MESSAGE = 'websocket:message',

  ERROR = 'error',
}
