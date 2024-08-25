import { WebServer } from './core/server';
import { Qiu } from './cli/Qiu';
import { DbTypes, Context } from './types';
import { Logger } from './helper/logger';
import { exposed, Route } from './core/decorators';
import { Delete, Get, Head, Options, Patch, Post, Put } from './core/router/index';
import { NxtFunction } from './types/index';
export { Context, NxtFunction };
export default class gland extends WebServer {
  constructor() {
    super();
  }
  Qiu(types: DbTypes, user: string, password: string) {
    return Qiu.getInstance(types, user, password);
  }
  lg() {
    return Logger;
  }
}
export { Get, Post, Put, Delete, Patch, Head, Options, Route, exposed };
