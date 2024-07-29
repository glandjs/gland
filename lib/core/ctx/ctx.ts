import { IncomingMessage, ServerResponse } from 'http'
import { Context } from '../../types/types';
export class WebContext{
    private rq: IncomingMessage;
    private rs: ServerResponse;
    public ctx: Context
    constructor(request:IncomingMessage,response:ServerResponse){
        this.rq = request;
        this.rs = response;
        this.ctx = new Proxy(this, {
            get: (t:WebContext, p:string | symbol)=>{
                switch(true){
                    case p in t:
                        return t[p as keyof WebContext];
                    case p in t.rs:
                        var v = t.rs[p as keyof ServerResponse];
                        return typeof v === 'function' ? v.bind(t.rs) : v;
                    case p in t.rq:
                        return t.rq[p as keyof IncomingMessage];
                    default:
                        throw new Error(`Property <'${String(p)}'> not found.`)
                }
            },
            set: (t:any, p:string | symbol, val:any) =>{
                (request as any)[p] = val;
                t.rq[p] = val;
                return t[val] = val;
            },
            has: (target: WebContext, p: string | symbol) => {
                return p in this.rs || p in this.rq;
            },
            deleteProperty:(t:any, p:string | symbol) =>{
                return delete t.rq[p];
            },
            
        })
    }
}