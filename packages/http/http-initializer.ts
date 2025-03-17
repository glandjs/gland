import type { HttpApplicationOptions } from './interface';
import { MiddlewareManager } from './middleware';
import { PipelineEngine } from './pipeline';
import { Router } from './router';
import type { HttpChannel } from './http-channel';
/**
 * Initialization manager for the HTTP server.
 *
 * This class handles the setup and configuration of core HTTP server
 * components, including middleware, routing, and request processing.
 */
export class HttpInitializer {
  constructor(private channel: HttpChannel) {}

  initialize(options?: HttpApplicationOptions) {
    const { broker, config, middleware, pipeline, router } = this.channel;
    new MiddlewareManager(middleware);
    new Router(router, config);
    new PipelineEngine(pipeline, broker, router, middleware);

    config.initialize(options);
  }
}
