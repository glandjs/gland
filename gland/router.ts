import { exposeds, Routes } from '../lib/core/decorators';
import { Delete, Get, Head, Options, Patch, Post, Put } from '../lib/core/router/index';
import { Context } from './index';
export const Route = Routes;
export const exposed = exposeds;
export { Get, Post, Put, Delete, Patch, Head, Options, Context };
