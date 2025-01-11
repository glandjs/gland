import { IncomingMessage, ServerResponse } from 'http';
import { HttpStatus } from '../common/enums/status.enum';
import { ServerRequest } from '../types';
export class Context {
  public ctx: ServerRequest;
  constructor(public req: IncomingMessage, public res: ServerResponse) {
    this.ctx = {} as ServerRequest;
    this.ctx.req = req;
    this.ctx.res = res;
    this.ctx.json = this.json.bind(this);
    this.ctx.status = this.status;
  }
  json(): Promise<void> {
    return new Promise((resolve, reject) => {
      let body = '';
      let bodySize = 0;
      let rawBody = Buffer.alloc(0);
      this.req.on('data', (chunk) => {
        body += chunk;
        bodySize += Buffer.from(chunk).length;
        rawBody = Buffer.concat([rawBody, chunk]);
      });
      this.req.on('end', () => {
        try {
          this.ctx.body = JSON.parse(body);
          this.ctx.bodySize = bodySize;
          this.ctx.bodyRaw = rawBody;
          resolve();
        } catch (error) {
          this.ctx.body = body === '' ? undefined : body;
          this.ctx.bodySize = bodySize;
          this.ctx.bodyRaw = rawBody;
          resolve();
        }
      });
      this.req.on('error', (error) => {
        reject(error);
      });
    });
  }
  get status() {
    return this.ctx.res.statusCode;
  }
  set status(code: HttpStatus) {
    this.ctx.res.statusCode = code;
    this.ctx.status = code;
  }
}
