import { Server } from 'net';
import { IncomingMessage, ServerResponse } from 'http';
import { isString, Logger } from '@medishn/toolkit';
import { TransportFactory } from './transport-factory';
import { ConnectionPool } from './connection-pool';
import { HttpApplicationOptions } from '../interface';

type TIncomingRequest = (req: IncomingMessage, res: ServerResponse) => Promise<void>;
/**
 * Manages the HTTP server lifecycle, including request handling and connection management.
 */
export class ServerTransport {
  private readonly _logger = new Logger({ context: 'HTTP:Transport' });
  private readonly _connectionPool = new ConnectionPool();
  private readonly _server: Server;
  /**
   * Maximum allowed port number for IPv4/IPv6.
   * @see https://stackoverflow.com/questions/113224/what-is-the-largest-tcp-ip-network-port-number-allowable-for-ipv4
   */
  private static readonly MAX_PORT = 65_535;

  constructor(private incomingRequest: TIncomingRequest, private readonly options?: HttpApplicationOptions) {
    this._server = TransportFactory.create(this.options);
  }

  public initialize(): void {
    this._server.on('request', this.incomingRequest);
    this._server.on('connection', (socket) => {
      this._connectionPool.track(socket);
    });

    this._server.on('close', () => {
      this._logger.info('Server closed.');
    });
  }

  public listen(port: number | string, hostname: string = 'localhost', message?: string) {
    const parsedPort = isString(port) ? parseInt(port, 10) : port;

    if (isNaN(parsedPort) || parsedPort < 0 || parsedPort > ServerTransport.MAX_PORT) {
      throw new Error(`Invalid port: ${port}`);
    }

    const defaultMessage = `Server listening on ${hostname}:${parsedPort}`;
    this._logger.info(message ?? defaultMessage);
    this._server.listen(parsedPort, hostname);
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
