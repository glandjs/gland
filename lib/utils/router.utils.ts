import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http';
import { TLSSocket } from 'tls';
import Reflector from '../metadata';
import { ContextFactory } from '../context';
import { RouteDefinition, ServerRequest, TransformContext } from '../common/interfaces';
import { ParsedBody } from '../common/types';
import { HttpStatus, KEY_SETTINGS, RouterMetadataKeys } from '../common/enums';
/**
 * The RouterUtils object contains utility constants and regular expressions used in routing and request handling.
 * It provides configurations such as API prefix, cache size limits, and language parameters, which assist in routing logic.
 */
export const RouterUtils = {
  API_PREFIX: '',
  DEFAULT_LANG: 'en',
  PARAMETER: /:([^/]+)/g,
};
/**
 * The RequestInfo class provides convenient access to key properties of the incoming request and response.
 * It extracts and formats information such as request body, headers, cookies, IP, method, status, and more.
 */
export class RequestInfo {
  private req: IncomingMessage;
  private res: ServerResponse;

  constructor(private ctx: ServerRequest) {
    this.req = ctx.req;
    this.res = ctx.res;
  }
  get body() {
    return this.ctx.body;
  }

  get bodySize(): ParsedBody['bodySize'] {
    const bodySize = this.res.getHeader('content-length');
    return bodySize ? bodySize.toString() : '0';
  }

  get bodyRaw(): ParsedBody['bodyRaw'] {
    return this.ctx.bodyRaw;
  }

  get statusCodeClass(): '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'Unknown' {
    const statusCode = this.res.statusCode;
    if (statusCode >= 100 && statusCode < 200) return '1xx';
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500 && statusCode < 600) return '5xx';
    return 'Unknown';
  }

  get method(): string {
    return this.req.method ?? '';
  }

  get url(): string {
    return this.req.url ?? '';
  }

  get cookies(): Record<string, string> {
    const cookiesHeader = this.req.headers?.['cookie'];
    const cookies: Record<string, string> = {};

    if (cookiesHeader) {
      const cookiePairs = cookiesHeader.split(';');
      cookiePairs.forEach((cookiePair) => {
        const [key, value] = cookiePair.split('=').map((part) => part.trim());
        if (key && value) {
          cookies[key] = value;
        }
      });
    }

    return cookies;
  }

  get protocol(): 'https' | 'http' {
    if (this.req.socket instanceof TLSSocket && this.req.socket.encrypted) {
      return 'https';
    } else {
      return 'http';
    }
  }

  get ip(): string {
    const trustProxy = this.ctx.settings[KEY_SETTINGS.TRUST_PROXY] || false;
    if (trustProxy) {
      const xff = this.req.headers['x-forwarded-for'];
      if (xff) {
        const ips = (xff as string).split(',');
        return ips[0].trim();
      }
    }
    return this.req.socket.remoteAddress || 'unknown';
  }

  get headers(): IncomingHttpHeaders {
    return this.req.headers;
  }

  get userAgent(): string {
    return this.req.headers?.['user-agent'] ?? '';
  }

  get referer(): string {
    return this.req.headers?.['referer'] ?? '';
  }

  get acceptedLanguages(): string {
    return this.req.headers?.['accept-language'] ?? '';
  }
}

/**
 * The ActionHandler class is responsible for managing the lifecycle of an incoming request, particularly
 * with regard to executing route-specific transformations, guards, and actions. It handles the core
 * functionality of ensuring that the correct transformations and guards are applied before the main
 * route action is executed, and it also processes the result of that action to send the appropriate
 * response back to the client.
 *
 * It provides three main functions:
 * 1. **executeTransform** - Handles data transformations before an action is executed. It checks if a
 *    transformation function exists in the route metadata and applies it to the context of the request.
 * 2. **executeGuards** - Runs any guards defined for the route. Guards are middleware-like functions
 *    that can terminate the request before the action is executed, based on certain conditions or
 *    authorization checks.
 * 3. **handleAction** - Executes the route action itself and processes its result. If the action returns
 *    data, it sends a success response; if the action returns nothing, it sends a "No Content" response.
 *
 * The `wrappedAction` method is a helper that orchestrates the flow by first executing any guards,
 * applying transformations, and finally invoking the actual route action.
 */
export class ActionHandler {
  static async executeTransform(transformFn: Function, ctx: ServerRequest, route: RouteDefinition, requestInfo: RequestInfo): Promise<void> {
    const transformContext: TransformContext = ContextFactory.createTransformContext(ctx, route, requestInfo);

    transformFn(transformContext);
    if (ctx.res.writableEnded) {
      throw new Error(
        'Invalid operation: Response cannot be ended within a transform function. ' +
          'The transform function is intended solely for data transformation or context manipulation and must not terminate the request/response lifecycle. ' +
          'To handle conditional request termination, consider using the Guard decorator instead. ',
      );
    }
  }

  static async executeGuards(guards: Function[], ctx: ServerRequest): Promise<void> {
    for (const guard of guards) {
      await guard(ctx);
      if (ctx.res.writableEnded) return;
    }
  }

  static async handleAction(action: Function, ctx: ServerRequest): Promise<void> {
    const result = await action(ctx);
    if (ctx.res.writableEnded) return;

    if (result !== undefined) {
      if (typeof result === 'object') {
        ctx.res.setHeader('Content-Type', 'application/json');
        ctx.send({ statusCode: HttpStatus.OK, message: 'OK', data: result });
      } else {
        ctx.send({ statusCode: HttpStatus.OK, message: 'OK', data: result });
      }
    } else {
      ctx.send({ statusCode: HttpStatus.NO_CONTENT, message: 'No Content' });
    }
  }
  static async wrappedAction({ ctx, route, requestInfo }: { ctx: ServerRequest; route: RouteDefinition; requestInfo: RequestInfo }) {
    const guards = Reflector.get(RouterMetadataKeys.GUARDS, route.constructor, route.action.name.split(' ')[1]);
    if (guards) await ActionHandler.executeGuards(guards, ctx);
    const transformFn = Reflector.get(RouterMetadataKeys.TRANSFORM, route.constructor, route.action.name);
    if (transformFn) await ActionHandler.executeTransform(transformFn, ctx, route, requestInfo);
    await ActionHandler.handleAction(route.action, ctx);
  }
}
