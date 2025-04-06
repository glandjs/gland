import { Logger } from '@medishn/toolkit';
import { IncomingRequestServer, ServerTransport } from '../server';
import { HttpEventCore } from './http-events';
import { HttpApplicationOptions } from '../interface';
import { Broker } from '@glandjs/events';

export class HttpAdapter {
  get protocol(): 'http' {
    return 'http';
  }
  public logger = new Logger({ context: 'HTTP:Adapter' });
  private _transport: ServerTransport;
  private readonly _incomingServer: IncomingRequestServer;
  public events: HttpEventCore;
  public broker: Broker;
  constructor() {
    this.broker = new Broker('http');
    this.events = new HttpEventCore(this.broker.channel('http'));
    this._incomingServer = new IncomingRequestServer(this.events);
    this.events.on('options', this.init.bind(this));
  }
  public async init(options: HttpApplicationOptions) {
    this.logger.info('Starting HTTP server...');
    this._transport = new ServerTransport(this._incomingServer.IncomingRequest.bind(this._incomingServer), options);
    this._transport.initialize();
  }
  public listen(port: string | number, hostname?: string, message?: string): void {
    try {
      this._transport.listen(port, hostname, message);
    } catch (error) {
      const listener = this.events.safeEmit('$server:crashed', {
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
