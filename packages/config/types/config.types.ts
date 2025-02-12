import { IncomingMessage } from 'http';
import { CorsOptions, CorsOptionsDelegate } from '../interface';
export type StaticOrigin = boolean | string | RegExp | (string | RegExp)[];

export type CustomOrigin = (requestOrigin: string, callback: (err: Error | null, origin?: StaticOrigin) => void) => void;

export type TrustProxyOption = boolean | number | 'loopback' | 'linklocal' | 'uniquelocal' | string | string[] | ((ip: string, distance: number) => boolean);

export type CorsConfig = boolean | CorsOptions | CorsOptionsDelegate<IncomingMessage>;
