import { IncomingMessage, ServerResponse } from 'http';
import { Context, RQ, RS } from '../../types/types';
export class WebContext {
  private rq: RQ;
  private rs: RS;
  public ctx: WebContext & Context;
  constructor(request: IncomingMessage, response: ServerResponse) {
    this.rq = request as RQ;
    this.rs = response as RS;
    this.ctx = new Proxy(this, {
      get: (t: WebContext, p: string | symbol) => {
        if (p in t) return t[p as keyof WebContext];
        if (p in t.rs)
          return typeof t.rs[p as keyof RS] === 'function'
            ? t.rs[p as keyof RS].bind(t.rs)
            : t.rs[p as keyof RS];
        if (p in t.rq) return t.rq[p as keyof RQ];
      },
      set: (target: WebContext, prop: string | symbol, value: any) => {
        if (prop in target.rq) {
          target.rq[prop as keyof RQ] = value;
        } else {
          target[prop as keyof WebContext] = value;
        }
        return true;
      },
      has: (target: WebContext, prop: string | symbol) => {
        return prop in target.rs || prop in target.rq;
      },
      deleteProperty: (target: any, prop: string | symbol) => {
        if (prop in (target || target.rq)) {
          return delete (target || target.rq)[prop as keyof WebContext];
        }
        return false;
      },
    }) as WebContext & Context;
  }
}
