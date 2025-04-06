import { Broker } from '@glandjs/events';
import type { HttpApplicationOptions } from './interface';
import { HttpCore } from './http-core';
import { BrokerAdapter } from '@glandjs/core';
import type { RouteRegister } from '@glandjs/core/injector';

/**
 * HttpBroker bridges HTTP-specific logic to the core Gland event system
 */
export class HttpBroker extends BrokerAdapter<HttpCore, HttpApplicationOptions> {
  public readonly broker: Broker;
  private readonly http: HttpCore;

  constructor(options?: HttpApplicationOptions) {
    super(options);
    this.http = new HttpCore(options);
    this.broker = this.http.broker;
  }

  public initialize(): HttpCore {
    this.broker.on<[RouteRegister]>('gland:router:register', (payload) => {
      const { method, action, controller } = payload;

      this.http.broker.emit('http:router:register', {
        method: method,
        path: controller.path,
        action,
      });
    });
    return this.http;
  }
}
