import { CoreEventType, HttpStatus } from '../enums';
import { EventHandlers, RouteDefinition, ServerRequest } from '../interfaces';

export type EventHandlerMap = {
  [CoreEventType.Start]: EventHandlers['StartHandler'];
  [CoreEventType.Stop]: EventHandlers['StopHandler'];
  [CoreEventType.Error]: EventHandlers['ErrorHandler'];
  [CoreEventType.Route]: EventHandlers['RouteHandler'];
};

export type EventHandler<T extends CoreEventType> = EventHandlerMap[T];
export type EventType = 'start' | 'stop' | 'error' | 'route';
export type CommonContextProps = {
  statusCode?: HttpStatus;
  method?: ServerRequest['req']['method'];
  url?: ServerRequest['req']['url'];
  headers?: ServerRequest['req']['headers'];
  query?: RouteDefinition['query'];
  params?: RouteDefinition['params'];
  path?: RouteDefinition['path'];
  body?: ServerRequest['body'];
  clientIp?: ServerRequest['clientIp'];
  cookies?: Record<string, string>;
  timestamp?: Date;
  statusMessage?: keyof typeof HttpStatus;
  statusCodeClass?: '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'Unknown';
  ctx: ServerRequest;
};
