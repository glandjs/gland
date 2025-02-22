import { ApplicationOptions } from '../application';

export type RequestHandler<TRequest = any, TResponse = any> = (req: TRequest, res: TResponse, next?: Function) => any;

export interface HttpServer<TRequest = any, TResponse = any, ServerInstance = any> {
  init(options: ApplicationOptions): void;
}
