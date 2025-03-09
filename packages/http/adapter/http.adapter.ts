import { isString, Logger } from '@medishn/toolkit';
import { IncomingRequestServer, ServerTransport } from '../server';
import { HttpEventCore } from './http-events';
import { Adapter } from '@gland/common';

export class HttpAdapter implements Adapter<'http'> {
  get protocol(): 'http' {
    return 'http';
  }
  protected logger = new Logger({ context: 'HTTP:Adapter' });
  private _transport: ServerTransport;
  private readonly _incomingServer: IncomingRequestServer;

  constructor(protected _events: HttpEventCore) {
    this._incomingServer = new IncomingRequestServer(_events);
  }
  public async init() {
    this._events.on('options', (options) => {
      this.logger.info('Starting HTTP server...');
      this._transport = new ServerTransport(this._incomingServer.IncomingRequest.bind(this._incomingServer), options);
      this._transport.initialize();
    });
  }
  public listen(port: string | number, hostname?: string): void {
    try {
      this._transport.listen(port, isString(hostname) ? hostname : 'localhost');
    } catch (error) {
      throw error;
    }
  }
  public shutdown(): Promise<void> {
    return this._transport.close();
  }
}
