import { WebServer } from './lib/core/server';
import { Qiu } from './lib/cli/Qiu';
import { DbTypes, Context } from './lib/types';
import { Logger } from './lib/helper/logger';
import { exposed, Route } from './lib/core/decorators';
import { Delete, Get, Head, Options, Patch, Post, Put } from './lib/core/router/index';
import { NxtFunction } from './lib/types/index';
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
