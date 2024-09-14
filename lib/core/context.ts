import { IncomingMessage, ServerResponse } from 'http';
import { Context, RQ, RS } from '../types';
import './router/request';
export class WebContext {
  public rq: RQ;
  public rs: RS;
  public ctx: Context;
  public body: any;
  public params: any;
  public query: any;
  constructor(request: IncomingMessage, response: ServerResponse) {
    this.rq = request;
    this.rs = response;
    this.body = null;
    this.params = {};
    this.query = {};
    this.ctx = new Proxy(this, this.opts()) as WebContext & Context;
  }
  private opts() {
    return {
      get: (t: WebContext, p: string | symbol) => {
        // Explicitly handle `on` method
        if (p === 'on' || p === 'once') {
          // Check if this method is being used in the request or response context
          if (typeof t.rq[p as keyof RQ] === 'function') {
            return t.rq[p as keyof RQ].bind(t.rq);
          }
          if (typeof t.rs[p as keyof RS] === 'function') {
            return t.rs[p as keyof RS].bind(t.rs);
          }
        }
        if (p in t) return t[p as keyof WebContext];
        if (p in t.rs) return typeof t.rs[p as keyof RS] === 'function' ? t.rs[p as keyof RS].bind(t.rs) : t.rs[p as keyof RS];
        if (p in t.rq) return t.rq[p as keyof RQ];
      },
      set: (t: WebContext, p: string | symbol, v: any) => {
        if (p in t.rs) {
          t.rs[p as keyof RS] = v;
        } else if (p in t.rq) {
          t.rq[p as keyof RQ] = v;
        } else {
          t[p as keyof WebContext] = v;
        }
        return true;
      },
      has: (t: WebContext, p: string | symbol) => {
        return p in t.rs || p in t.rq;
      },
      deleteperty: (t: any, p: string | symbol) => {
        if (p in (t || t.rq)) {
          return delete (t || t.rq)[p as keyof WebContext];
        }
        return false;
      },
    };
  }
}
