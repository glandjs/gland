import { IncomingMessage, ServerResponse, HttpContext } from 'http';
import { HttpStatus } from '../common/enums/status.enum';
export class Context {
  public ctx: HttpContext;
  constructor(public req: IncomingMessage, public res: ServerResponse) {
    this.ctx = Object.assign(res, req) as HttpContext;
    this.ctx.json = this.json.bind(this);
    this.ctx.code = this.code.bind(this);
  }
  async json(): Promise<object | undefined> {
    return new Promise((resolve, reject) => {
      let body = '';
      this.ctx.on('data', (chunk) => {
        body += chunk;
      });
      this.ctx.on('end', () => {
        if (!body) {
          resolve(undefined);
        } else {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(new Error('Invalid JSON format.'));
          }
        }
      });
      this.ctx.on('error', (error) => {
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
