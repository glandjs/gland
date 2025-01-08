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
    this.ctx.code = this.code.bind(this);
  }
  private bindProperties(req: IncomingMessage, res: ServerResponse) {
    // List of properties/methods from req
    const reqKeys = Object.keys(req).concat(Object.getOwnPropertyNames(IncomingMessage.prototype));
    // List of properties/methods from res
    const resKeys = Object.keys(res).concat(Object.getOwnPropertyNames(ServerResponse.prototype));

    // Define getters/setters for req properties
    for (const key of reqKeys) {
      if (key in this.ctx) continue; // Avoid overriding existing properties
      Object.defineProperty(this.ctx, key, {
        get: () => (req as any)[key],
        set: (value) => ((req as any)[key] = value),
        enumerable: true,
        configurable: true,
      });
    }

    // Define getters/setters for res properties
    for (const key of resKeys) {
      if (key in this.ctx) continue; // Avoid overriding existing properties
      Object.defineProperty(this.ctx, key, {
        get: () => (res as any)[key],
        set: (value) => ((res as any)[key] = value),
        enumerable: true,
        configurable: true,
      });
    }
    // Special handling for methods that belong only to res
    Object.defineProperty(this.ctx, 'writeHead', {
      get: () => res.writeHead.bind(res), // Ensure `writeHead` points to `res.writeHead`
      enumerable: true,
      configurable: true,
    });

    // You can add more specific methods as needed, like `end`, `setHeader`, etc.
    Object.defineProperty(this.ctx, 'end', {
      get: () => res.end.bind(res), // Ensure `end` points to `res.end`
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
          reject(new Error('Invalid JSON format.'));
        }
      });
      this.req.on('error', (error) => {
        reject(error);
      });
    });
  }

  code(code: HttpStatus): boolean {
    this.ctx.statusCode = code;
    if ((this.ctx.statusCode && this.res.statusCode) === code) {
      return true;
    }
    return false;
  }
}
