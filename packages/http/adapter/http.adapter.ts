import { Logger } from '@medishn/toolkit';
import { IncomingRequestServer, ServerTransport } from '../server';
import { HttpEventCore } from './http-events';
import { Adapter } from '@gland/common';
import { HttpApplicationOptions } from '../interface';
import { Broker } from '@gland/events';

export class HttpAdapter implements Adapter<'http'> {
  get protocol(): 'http' {
    return 'http';
  }
  protected logger = new Logger({ context: 'HTTP:Adapter' });
  private _transport: ServerTransport;
  private readonly _incomingServer: IncomingRequestServer;
  protected _events: HttpEventCore;
  protected _broker: Broker;
  constructor() {
    this._broker = new Broker('http');
    this._events = new HttpEventCore(this._broker.channel('http'));
    this._incomingServer = new IncomingRequestServer(this._events);
    this._events.once('options', this.init.bind(this));
  }
  public async init(options: HttpApplicationOptions) {
    this.logger.info('Starting HTTP server...');
    this._transport = new ServerTransport(this._incomingServer.IncomingRequest.bind(this._incomingServer), options);
    this._transport.initialize();
  }
  protected _listen(port: string | number, hostname?: string, message?: string): void {
    try {
      this._transport.listen(port, hostname, message);
    } catch (error) {
      const listener = this._events.safeEmit('$server:crashed', {
        message: 'Failed to start HTTP server',
        error: error,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      if (!listener) {
        throw error;
      }
    }
  }
  public shutdown(): Promise<void> {
    return this._transport.close();
  }
}
