import { IncomingMessage, ServerResponse } from 'http';
import { HttpStatus } from '../common/enums/status.enum';
import { HttpContext } from '../types';
export class Context {
  public ctx: HttpContext;
  constructor(public req: IncomingMessage, public res: ServerResponse) {
    this.ctx = {} as HttpContext;
    this.bindProperties(req, res);
    this.ctx.req = req;
    this.ctx.res = res;
    this.ctx.json = this.json.bind(this);
    this.ctx.status = this.status.bind(this);
  }
  private bindProperties(req: IncomingMessage, res: ServerResponse) {
    // List of properties/methods from req
    const reqKeys = Object.keys(req).concat(Object.getOwnPropertyNames(IncomingMessage.prototype));
    // List of properties/methods from res
    const resKeys = Object.keys(res).concat(Object.getOwnPropertyNames(ServerResponse.prototype));

    for (const key of reqKeys) {
      if (key in this.ctx) continue;
      Object.defineProperty(this.ctx, key, {
        get: () => (req as any)[key],
        set: (value) => ((req as any)[key] = value),
        enumerable: true,
        configurable: true,
      });
    }

    for (const key of resKeys) {
      if (key in this.ctx) continue;
      Object.defineProperty(this.ctx, key, {
        get: () => (res as any)[key],
        set: (value) => ((res as any)[key] = value),
        enumerable: true,
        configurable: true,
      });
    }

    Object.defineProperty(this.ctx, 'writeHead', {
      get: () => res.writeHead.bind(res),
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(this.ctx, 'end', {
      get: () => res.end.bind(res),
      enumerable: true,
      configurable: true,
    });
  }
  json(): Promise<void> {
    return new Promise((resolve, reject) => {
      let body = '';
      this.req.on('data', (chunk) => {
        body += chunk;
      });
      this.req.on('end', () => {
        try {
          this.ctx.body = JSON.parse(body);
          resolve();
        } catch (error) {
          this.ctx.body = body;
          resolve();
        }
      });
      this.req.on('error', (error) => {
        reject(error);
      });
    });
  }

  status(code: HttpStatus): HttpContext {
    // Assign the status code
    this.ctx.statusCode = code;
    this.res.statusCode = code;
    if ((this.ctx.statusCode && this.res.statusCode) === code) {
      return this.ctx;
    }
    return this.ctx;
  }
}
