import { IncomingMessage, ServerResponse } from 'http';
import Reflect from '../metadata';
import { Appliction } from '../core/Application';
import { Context } from '../core/Context';
import { HttpStatus } from '../common/enums/status.enum';

declare module 'http' {
  type HttpContext = IncomingMessage &
    ServerResponse & {
      server: Application;
      json(): Promise<object | undefined>;
      code(code: HttpStatus): boolean;
    };
}
