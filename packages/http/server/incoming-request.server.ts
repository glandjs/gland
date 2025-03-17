import { IncomingMessage, ServerResponse } from 'http';
import { HttpStatus } from '@medishn/toolkit';
import { HttpServerContext } from '../context';
import { HttpEventCore } from '../adapter';

export class IncomingRequestServer {
  constructor(private _events: HttpEventCore) {}
  public async IncomingRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const context = new HttpServerContext(this._events, req, res);
    try {
      this._events.emit('request', context);
    } catch (error) {
      context.status = HttpStatus.INTERNAL_SERVER_ERROR;
      context.error = error;

      const serverevent = this._events.safeEmit('$server:crashed', {
        message: 'Server crashed during request processing',
        error: error,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      const requestevent = this._events.safeEmit('$request:failed', context);
      const errorListeners = requestevent || serverevent;
      if (!errorListeners) {
        throw error;
      }
    }
  }
}
