import { Logger, type Dictionary } from '@medishn/toolkit';
import { Duplex } from 'stream';

export class ConnectionPool {
  private readonly _active: Dictionary<Duplex> = {};
  private readonly _logger = new Logger({ context: 'HTTP:ConnectionPool' });
  private _id = 0;

  constructor() {}
  public track(socket: Duplex): void {
    const id = (++this._id).toString();

    this._active[id] = socket;

    socket.once('close', () => {
      delete this._active[id];
      this._logger.info(`Connection ${id} closed. Remaining: ${this._active.size}`);
    });
    socket.on('error', (err) => {
      this._logger.error(`Connection ${id} error:`, err);
      socket.destroy();
    });
    this._logger.info(`New connection ${id}. Total: ${this._active.size}`);
  }

  public async closeAll(): Promise<void> {
    this._logger.info(`Closing ${Object.keys(this._active).length} active connections...`);

    const closePromises = Object.entries(this._active).map(([id, socket]) => {
      return new Promise<void>((resolve) => {
        socket.once('close', () => {
          this._logger.info(`Connection ${id} successfully closed`);
          resolve();
        });

        socket.end(() => {
          setTimeout(() => {
            if (!socket.destroyed) {
              this._logger.info(`Forcing close of connection ${id}`);
              socket.destroy();
            }
          }, 2000);
        });
      });
    });

    await Promise.all(closePromises);
    Object.keys(this._active).forEach((id) => delete this._active[id]);
    this._logger.info('All connections closed.');
  }
}
