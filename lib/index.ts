import { WebServer } from './core/server';
import { Context } from './types';
import { Route } from './core/decorators';
import { Delete, Get, Head, Options, Patch, Post, Put, All } from './core/router/index';
import { NxtFunction } from './types/index';
import { mid, mids } from './core/decorators';
import { Gmids } from './core/middleware';
export { Context, NxtFunction };
export default class gland extends WebServer {
  constructor() {
    super();
  }
}
export { Get, Post, Put, Delete, Patch, Head, Options, Route, mid, mids, All };
export var Gmid = Gmids.set;
