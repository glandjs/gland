import { GlandMiddleware } from '../types';

export interface Listener {
  listen(): GlandMiddleware;
}
