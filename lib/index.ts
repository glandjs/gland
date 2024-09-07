import { WebServer } from './core/server';
import { Qiu } from './cli/Qiu';
import { DbTypes, Context } from './types';
import { exposed, Route } from './core/decorators';
import { Delete, Get, Head, Options, Patch, Post, Put, All } from './core/router/index';
import { NxtFunction } from './types/index';
import { mid, mids } from './core/decorators/index';
import { Gmids } from './core/middleware';
import { Factory } from '@medishn/gland-logger';
export { Context, NxtFunction };
export default class gland extends WebServer {
  constructor() {
    super();
  }
  Qiu(types: DbTypes, user: string, password: string) {
    return Qiu.getInstance(types, user, password);
  }
  lg() {
    return Factory;
  }
}
export { Get, Post, Put, Delete, Patch, Head, Options, Route, exposed, mid, mids, All };
export var Gmid = Gmids.set;
