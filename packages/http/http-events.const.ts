export const HTTP_EVENTS = {
  ROUTER: `router`,
  PIPELINE: `pipeline`,
  MIDDLEWARE: `middleware`,
};

export const RouterEvent = {
  MATCH: `${HTTP_EVENTS.ROUTER}:match`,
  ROUTER_REGISTER: `${HTTP_EVENTS.ROUTER}:register`,
};

export type RouterEventType = keyof typeof RouterEvent;

export const PipelineEvent = {
  PIPELINE_EXECUTE: `${HTTP_EVENTS.PIPELINE}:execute`,
  PIPELINE_REGISTER: `${HTTP_EVENTS.PIPELINE}:register`,
};

export type PipelineEventType = keyof typeof PipelineEvent;

export const MiddlewareEvent = {
  MIDDLEWARE_REGISTER: `${HTTP_EVENTS.MIDDLEWARE}:register`,
  MIDDLEWARE_EXECUTE: `${HTTP_EVENTS.MIDDLEWARE}:execute`,
  GLOBAL: `${HTTP_EVENTS.MIDDLEWARE}:global`,
  RESOLVER: `${HTTP_EVENTS.MIDDLEWARE}:resolve`,
  FOR_ROUTE: `${HTTP_EVENTS.MIDDLEWARE}:route-specific`,
  MOUNT: `${HTTP_EVENTS.MIDDLEWARE}:mount`,
  APPLY_GLOBAL: `${HTTP_EVENTS.MIDDLEWARE}:apply-global`,
  USE: `${HTTP_EVENTS.MIDDLEWARE}:use`,
};

export type MiddlewareEventType = keyof typeof MiddlewareEvent;
export type AllHttpEvents = MiddlewareEventType | PipelineEventType | RouterEventType;
type HttpEventMap = {
  [M in AllHttpEvents]: M | `${M}` | AllHttpEvents;
};
export type HttpEventType<T extends string = string> = `${HttpEventMap[keyof HttpEventMap]}` | T;
