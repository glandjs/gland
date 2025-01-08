import { ServerResponse } from 'http';
import { IncomingMessage } from 'http';
import { Application } from '../core/Application';
import { HttpStatus } from '../common/enums/status.enum';

export interface ModuleConfig {
  path: string;
  routes: string[];
  cache?: boolean;
  watch?: boolean;
}
export type HttpContext = IncomingMessage &
  ServerResponse & {
    req: IncomingMessage;
    res: ServerResponse;
    server: Application;
    json(): Promise<void>;
    code(code: HttpStatus): boolean;
    params: { [key: string]: string };
    body: Record<string, string> | undefined;
  };
