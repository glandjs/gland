import { RequestInfo } from '../utils';
import { Environment } from '../common/enums';
import { RouteDefinition, LifecycleEvents, ServerRequest, TransformContext } from '../common/interfaces';

export class ContextFactory {
  /**
   * Creates a Route Context for a given request and route.
   * @param ctx - The server request object
   * @param route - The matched route definition
   * @param requestInfo - Parsed request information
   */
  static createRouteContext(ctx: ServerRequest, route: RouteDefinition, requestInfo: RequestInfo): LifecycleEvents['Route'] {
    return {
      ctx,
      path: route.path,
      method: route.method,
      params: ctx.params,
      query: ctx.query,
      middlewares: route.middlewares,
      statusCode: ctx.res.statusCode,
      headers: ctx.req.headers,
      clientIp: requestInfo.ip,
      statusMessage: 'OK',
      statusCodeClass: requestInfo.statusCodeClass,
      cacheControl: ctx.req.headers['cache-control'] ?? undefined,
      isCacheHit: false,
      response: {
        contentLength: ctx.req.headers['content-length'],
        contentType: ctx.req.headers['content-type'],
      },
      request: {
        body: ctx.body,
        url: ctx.req.url,
        cookies: requestInfo.cookies,
        protocol: requestInfo.protocol,
        userAgent: requestInfo.userAgent,
        referer: requestInfo.referer,
        acceptedLanguages: requestInfo.acceptedLanguages,
        bodySize: ctx.bodySize,
        bodyRaw: ctx.bodyRaw,
      },
    };
  }

  /**
   * Creates a Transform Context for modifying or transforming request/response data.
   * @param ctx - The server request object
   * @param route - The matched route definition
   * @param requestInfo - Parsed request information
   */
  static createTransformContext(ctx: ServerRequest, route: RouteDefinition, requestInfo: RequestInfo): TransformContext {
    return {
      params: ctx.params,
      query: ctx.query,
      body: ctx.body,
      headers: ctx.req.headers,
      method: ctx.req.method!,
      path: route.path,
      clientIp: requestInfo.ip,
      userAgent: requestInfo.userAgent,
      cookies: requestInfo.cookies,
      protocol: requestInfo.protocol,
      referer: requestInfo.referer,
      acceptedLanguages: requestInfo.acceptedLanguages,
    };
  }

  /**
   * Creates an Error Context for handling errors gracefully.
   * @param ctx - The server request object
   * @param error - The error encountered
   */
  static createErrorContext(ctx: ServerRequest, error: LifecycleEvents['Error']['error']): LifecycleEvents['Error'] {
    return {
      ctx,
      method: ctx.req.method!,
      headers: ctx.req.headers,
      body: ctx.body,
      statusCode: ctx.res.statusCode,
      statusMessage: 'OK',
      statusCodeClass: '2xx',
      timestamp: new Date(),
      error,
    };
  }

  /**
   * Creates a Start Context for lifecycle events.
   * @param environment - The runtime environment (e.g., production, development)
   * @param appInfo - Application-related metadata
   */
  static createStartContext(environment: Environment, appInfo: { serverId: string; hostname: string; version: string; nodeVersion: string }): LifecycleEvents['Start'] {
    return {
      timestamp: new Date(),
      environment,
      ...appInfo,
      uptime: process.uptime(),
    };
  }

  /**
   * Creates a Stop Context for application shutdown events.
   * @param reason - Reason for shutdown
   * @param exitCode - Process exit code
   * @param error - Optional error if shutdown was due to a critical error
   */
  static createStopContext(reason: LifecycleEvents['Stop']['reason'], exitCode?: number | string, error?: Error): LifecycleEvents['Stop'] {
    return {
      timestamp: new Date(),
      statusMessage: 'OK',
      statusCode: 200,
      statusCodeClass: '2xx',
      reason,
      exitCode,
      error,
    };
  }
}
