import { Constructor } from '@medishn/toolkit';
import { ApplicationOptions } from '../application';
import { DynamicModule } from '../modules.interfaces';

export type RequestHandler<TRequest = any, TResponse = any> = (req: TRequest, res: TResponse, next?: Function) => any;

export interface HttpServer<TRequest = any, TResponse = any, ServerInstance = any> {
  init(rootModule: Constructor | DynamicModule, options?: ApplicationOptions): void;
}
