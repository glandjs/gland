import { Logger } from '@medishn/toolkit';
import { Duplex } from 'stream';

export class ConnectionPool{
  private readonly _active = new Set<Duplex>();
  private readonly _logger = new Logger({ context: 'HTTP:ConnectionPool' });

  public track(socket: Duplex): void {
    this._active.add(socket);
    socket.once('close', () => {
      this._active.delete(socket);
      this._logger.info(`Connection closed. Remaining: ${this._active.size}`);
    });
    this._logger.info(`New connection. Total: ${this._active.size}`);
  }

  public async closeAll(): Promise<void> {
    this._logger.info(`Closing ${this._active.size} active connections...`);
    for (const socket of this._active) {
      socket.destroy();
      this._active.delete(socket);
    }
    this._logger.info('All connections closed.');
  }

  public getConnectionCount(): number {
    return this._active.size;
  }
}
