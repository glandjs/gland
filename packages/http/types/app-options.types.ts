import { Maybe } from '@medishn/toolkit';
import { IncomingMessage } from 'http';
import { CorsOptions, CorsOptionsDelegate, HttpContext } from '../interface/';
export type StaticOrigin = boolean | string | RegExp | (string | RegExp)[];

export type CustomOrigin = (requestOrigin: string, callback: (err: Maybe<Error>, origin?: StaticOrigin) => void) => void;

export type TrustProxyOption = boolean | number | 'loopback' | 'linklocal' | 'uniquelocal' | string | string[] | ((ip: string, distance: number) => boolean);

export type CorsConfig = boolean | CorsOptions | CorsOptionsDelegate<IncomingMessage>;
export type ServerListener = {
  port: number;
  host: string;
};

export type ServerListenerCallback = (error: Error) => void;
export type ApplicationEventMap = {
  ready: ServerListener;
  error: ServerListenerCallback;
  'route:not-found': (ctx: HttpContext) => Promise<void> | void;
  'request:error': (error: any, ctx: HttpContext) => Promise<void> | void;
};

export type EntityTagStrength = 'strong' | 'weak';
export type EntityTagAlgorithm = 'sha256' | 'md5' | 'random';
export interface EntityTagOptions {
  strength?: EntityTagStrength;
  algorithm?: EntityTagAlgorithm;
}
