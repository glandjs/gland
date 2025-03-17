import { ConfigChannel } from './config';
import { RouterChannel } from './router';
import type { HttpEventCore } from './adapter';
import { PipelineChannel } from './pipeline';
import { MiddlewareChannel } from './middleware';
/**
 * Central communication channel for HTTP-related functionality.
 *
 * `HttpChannel` provides access to various subsystems of the HTTP server,
 * including configuration, routing, middleware, and pipeline processing.
 * It acts as a facade that simplifies interaction with the underlying
 */
export class HttpChannel {
  constructor(public broker: HttpEventCore) {}
  get config() {
    return new ConfigChannel(this.broker.channel('config'));
  }
  get router() {
    return new RouterChannel(this.broker.channel('router'));
  }
  get pipeline() {
    return new PipelineChannel(this.broker.channel('pipeline'));
  }
  get middleware() {
    return new MiddlewareChannel(this.broker.channel('middleware'));
  }
}
