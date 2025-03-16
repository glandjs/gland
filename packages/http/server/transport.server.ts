import { Server } from 'net';
import { IncomingMessage, ServerResponse } from 'http';
import { Logger } from '@medishn/toolkit';
import { TransportFactory } from './transport-factory';
import { ConnectionPool } from './connection-pool';
import { HttpApplicationOptions } from '../interface';
type TIncomintRequest = (req: IncomingMessage, res: ServerResponse) => Promise<void>;
export class ServerTransport {
  private readonly _logger = new Logger({ context: 'HTTP:Transport' });
  private readonly _connectionPool = new ConnectionPool();
  private _server: Server;

  constructor(private incomingRequest: TIncomintRequest, private readonly options?: HttpApplicationOptions) {}

  public initialize(): void {
    this._server = TransportFactory.create(this.options);

    this._server.on('request', this.incomingRequest);
    this._server.on('connection', (socket) => {
      this._connectionPool.track(socket);
    });

    this._server.on('close', () => {
      this._logger.info('Server closed.');
    });
  }

  listen(port: string | number, hostname: string) {
    this._logger.info(`Server listening on ${hostname}:${port}`);
    const portNumber = Number(port);
    if (isNaN(portNumber)) {
      this._logger.error(`Invalid port: ${port}`);
      return;
    }
    this._server.listen(portNumber, hostname);
  }

  public async close(): Promise<void> {
    this._logger.info('Shutting down server...');
    await this._connectionPool.closeAll();
    return new Promise((resolve, reject) => {
      this._server.close((err) => {
        if (err) {
          this._logger.error('Server shutdown error:', err);
          reject(err);
        } else {
          this._logger.info('Server successfully shut down');
          resolve();
        }
        resolve();
      });
    });
  }
}
