import { IncomingMessage, ServerResponse } from 'http';
import { Application } from '../core/Application';
import { HttpStatus } from '../common/enums/status.enum';
import { AppConfig, GlobalCache } from '../common/interface/app-settings.interface';
import { Context } from '../context/Context';
import { ResponseBody } from '../context/Context.interface';

export interface ModuleConfig {
  path: string;
  routes: string[];
  cache?: boolean;
  watch?: boolean;
}
export type ServerRequest = Context & {
  req: IncomingMessage;
  res: ServerResponse;
  /** Application instance */
  status: number;
  server: Application;
  send<T = any>(body: ResponseBody<T>): void;
  bodySize: number;
  bodyRaw: Buffer;
  /** Parsed query parameters from the URL */
  query: Record<string, string | number | undefined>;

  /** Route parameters from the matched route */
  params: Record<string, string | number>;

  /** Parsed body of the request */
  body: Record<string, any> | string | undefined | { [key: string]: any };
  /** Utilities for localization (multi-language) */
  lang(defaultLang?: string): string;

  /** Send a response with custom content type */
  send(data: any, contentType?: string): void;

  /** Redirect to another URL */
  redirect(url: string, status?: HttpStatus): void;
  cache: GlobalCache;
  clientIp: string;
  settings: AppConfig;
  error: any;
};
