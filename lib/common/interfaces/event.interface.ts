import { IncomingMessage } from 'http';
import { CommonContextProps, ParsedBody } from '../types';
import { RouteDefinition } from './router.interface';
import { AppConfig } from './app-settings.interface';

export interface LifecycleEvents {
  Start: Pick<CommonContextProps, 'timestamp'> & {
    environment?: AppConfig['environment'];
    serverId?: string;
    hostname?: string;
    version?: string;
    uptime?: number;
    nodeVersion?: string;
  };

  Stop: Pick<CommonContextProps, 'statusCodeClass' | 'statusMessage' | 'statusCode' | 'timestamp'> & {
    reason?: 'maintenance' | 'shutdown' | 'server_error' | 'error' | 'timeout';
    exitCode?: number | string;
    error?: Error;
  };
  Error: Pick<CommonContextProps, 'ctx' | 'statusCodeClass' | 'statusMessage' | 'method' | 'body' | 'headers' | 'statusCode' | 'timestamp'> & {
    error: any | null;
  };
  Route: Pick<RouteDefinition, 'middlewares'> &
    Pick<CommonContextProps, 'ctx' | 'statusCodeClass' | 'statusMessage' | 'method' | 'path' | 'query' | 'params' | 'statusCode' | 'headers' | 'clientIp'> & {
      cacheControl?: string;
      response?: {
        contentLength?: IncomingMessage['headers']['content-length'];
        contentType?: IncomingMessage['headers']['content-type'];
      };
      request?: Pick<CommonContextProps, 'body' | 'url' | 'cookies'> & {
        protocol?: string;
        userAgent?: string;
        referer?: string;
        acceptedLanguages?: IncomingMessage['headers']['accept-language'];
        bodySize?: ParsedBody['bodySize'];
        bodyRaw?: ParsedBody['bodyRaw'];
      };
      isCacheHit?: boolean;
    };
}
export interface EventHandlers {
  StartHandler: (ctx: LifecycleEvents['Start']) => Promise<void> | void;
  StopHandler: (ctx: LifecycleEvents['Stop']) => Promise<void> | void;
  ErrorHandler: (ctx: LifecycleEvents['Error']) => Promise<void> | void;
  RouteHandler: (ctx: LifecycleEvents['Route']) => Promise<void> | void;
}
