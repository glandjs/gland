import { IncomingMessage } from 'http';
import { Environment } from '../common/interface/app-settings.interface';
import { RouteDefinition } from '../common/interface/router.interface';
import { ServerRequest } from '../types';
import { HttpStatus } from '../common/enums/status.enum';

export enum CoreEventType {
  Start = 'start',
  Stop = 'stop',
  Error = 'error',
  Route = 'route',
}
export type EventType = 'start' | 'stop' | 'error' | 'route';

export type CommonProps = {
  statusCode?: ServerRequest['res']['statusCode'];
  method?: ServerRequest['req']['method'];
  url?: ServerRequest['req']['url'];
  headers?: ServerRequest['req']['headers'];
  query?: RouteDefinition['query'];
  params?: RouteDefinition['params'];
  path?: RouteDefinition['path'];
  body?: ServerRequest['body'];
  ip?: string;
  cookies?: Record<string, string>;
  timestamp?: Date;
};

export interface ContextHandler {
  StartContext: Pick<CommonProps, 'timestamp'> & {
    environment?: Environment; // Environment (e.g., 'development', 'production')
    serverId?: string; // Unique identifier for the server instance (useful in a distributed system)
    hostname?: string; // Hostname of the server
    version?: string; // Application version (e.g., 'v1.0.0')
    uptime?: number; // System uptime in seconds
    nodeVersion?: string; // Node.js version running on the server
  };

  StopContext: Pick<CommonProps, 'statusCode' | 'timestamp'> & {
    reason?: 'maintenance' | 'shutdown' | 'server_error' | 'error' | 'timeout';
    exitCode?: number | string;
    error?: Error;
  };
  ErrorContext: Pick<CommonProps, 'method' | 'path' | 'query' | 'body' | 'headers' | 'statusCode' | 'timestamp' | 'ip'> & {
    error: Error;
    message: string; // Human-readable error message
  };
  RouteContext: Pick<RouteDefinition, 'middlewares'> &
    Pick<CommonProps, 'method' | 'path' | 'query' | 'params' | 'statusCode' | 'headers' | 'ip'> & {
      cacheControl?: string | undefined; // Cache control settings
      response?: {
        contentLength?: IncomingMessage['headers']['content-length']; // Content length of the response
        contentType?: IncomingMessage['headers']['content-type']; // Content type of the response
      };
      request?: Pick<CommonProps, 'body' | 'url' | 'cookies'> & {
        protocol?: string; // HTTP protocol (http, https)
        userAgent?: string; // User-Agent header (can help identify the client)
        referer?: string | undefined; // Referrer URL if provided
        acceptedLanguages?: IncomingMessage['headers']['accept-language']; // List of accepted languages (from Accept-Language header)
        bodySize?: number; // Size of the request body in bytes
        bodyRaw?: Buffer; // Raw request body (if needed for processing)
      };
      statusMessage?: keyof typeof HttpStatus; // Status message (e.g., 'OK', 'Not Found')
      statusCodeClass?: '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'Unknown';
      isCacheHit?: boolean; // Whether the response was served from the cache
    };
}

export interface EventHandlers {
  StartHandler: (ctx: ContextHandler['StartContext']) => Promise<void> | void;
  StopHandler: (ctx: ContextHandler['StopContext']) => Promise<void> | void;
  ErrorHandler: (ctx: ContextHandler['ErrorContext']) => Promise<void> | void;
  RouteHandler: (ctx: ContextHandler['RouteContext']) => Promise<void> | void;
}

export type EventHandlerMap = {
  [CoreEventType.Start]: EventHandlers['StartHandler'];
  [CoreEventType.Stop]: EventHandlers['StopHandler'];
  [CoreEventType.Error]: EventHandlers['ErrorHandler'];
  [CoreEventType.Route]: EventHandlers['RouteHandler'];
};

export type EventHandler<T extends CoreEventType> = EventHandlerMap[T];
