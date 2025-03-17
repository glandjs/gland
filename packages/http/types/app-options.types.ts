import { Maybe } from '@medishn/toolkit';
import { IncomingMessage } from 'http';
import { CorsOptions, CorsOptionsDelegate, HttpContext } from '../interface/';
export type StaticOrigin = boolean | string | RegExp | (string | RegExp)[];

export type CustomOrigin = (requestOrigin: string, callback: (err: Maybe<Error>, origin?: StaticOrigin) => void) => void;

export type TrustProxyOption = boolean | number | 'loopback' | 'linklocal' | 'uniquelocal' | string | string[] | ((ip: string, distance: number) => boolean);
export type CorsConfig = boolean | CorsOptions | CorsOptionsDelegate<IncomingMessage>;
export type ServerListeningEvent = {
  port: number;
  host?: string;
  message?: string;
};
export type ServerCrashedEvent = {
  message: string;
  error: Error;
  stack: string;
  timestamp: string;
};

export type ServerListenerCallback = (error: ServerCrashedEvent) => void;
export type ApplicationEventMap = {
  '$server:ready': ServerListeningEvent;
  '$server:crashed': ServerListenerCallback;
  '$router:miss': (ctx: HttpContext) => Promise<void> | void;
  '$request:failed': (error: any, ctx: HttpContext) => Promise<void> | void;
};

export type EntityTagStrength = 'strong' | 'weak';
export type EntityTagAlgorithm = 'sha256' | 'md5' | 'random';
export interface EntityTagOptions {
  strength?: EntityTagStrength;
  algorithm?: EntityTagAlgorithm;
}
