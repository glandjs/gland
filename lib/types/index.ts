import { ServerResponse } from 'http';
import { IncomingMessage } from 'http';
import { Application } from '../core/Application';
import { HttpStatus } from '../common/enums/status.enum';
import { GlobalCache } from '../common/interface/app-settings.interface';

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
    /** Application instance */
    server: Application;
    json(): Promise<void>;
    /** Set status code for the response */
    status(code: HttpStatus): HttpContext;

    /** Parsed query parameters from the URL */
    query: Record<string, string | number | undefined>;

    /** Route parameters from the matched route */
    params: Record<string, string | number>;

    /** Parsed body of the request */
    body: Record<string, any> | string | undefined;
    /** Utilities for localization (multi-language) */
    lang(defaultLang?: string): string;

    /** Send a response with custom content type */
    send(data: any, contentType?: string): void;

    /** Redirect to another URL */
    redirect(url: string, status?: HttpStatus): void;
    cache: GlobalCache;
  };
