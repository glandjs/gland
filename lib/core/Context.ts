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
  bindProperties(req: IncomingMessage, res: ServerResponse) {
    const bindRuntimeProperties = (source: any, target: any) => {
      let currentProto = source;

      while (currentProto) {
        const keys = [
          ...Object.getOwnPropertyNames(currentProto), // Own properties
          ...Object.getOwnPropertySymbols(currentProto), // Symbol properties
        ];

        keys.forEach((key) => {
          const keyName = typeof key === 'symbol' ? key : key;

          if (!(keyName in target)) {
            const descriptor = Object.getOwnPropertyDescriptor(currentProto, key) || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(currentProto), key);

            if (descriptor) {
              if (typeof descriptor.value === 'function') {
                // Bind methods
                target[keyName] = source[key].bind(source);
              } else {
                // Define getters and setters for properties
                Object.defineProperty(target, keyName, {
                  get: () => source[key],
                  set: (value) => {
                    source[key] = value;
                  },
                  enumerable: descriptor.enumerable,
                  configurable: true,
                });
              }
            }
          }
        });

        // Move up the prototype chain
        currentProto = Object.getPrototypeOf(currentProto);
      }
    };

    // Bind req and res properties/methods to ctx
    bindRuntimeProperties(req, this.ctx); // Bind req properties
    bindRuntimeProperties(res, this.ctx); // Bind res properties

    // Ensure that ctx is always in sync with res and req
    const syncProperties = (source: any, target: any) => {
      Object.defineProperties(target, {
        ...Object.getOwnPropertyDescriptors(source),
        ...Object.getOwnPropertyDescriptors(Object.getPrototypeOf(source)),
      });
    };

    // Sync req and res properties to ctx
    syncProperties(req, this.ctx);
    syncProperties(res, this.ctx);
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
          this.ctx.body = body === '' ? undefined : body;
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
