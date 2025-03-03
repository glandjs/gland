import { Context } from '../interfaces';

export type TtlIdentifier = number;

export type EntityTagStrength = 'strong' | 'weak';
export type EntityTagAlgorithm = 'sha256' | 'md5' | 'random';
export interface EntityTagOptions {
  strength?: EntityTagStrength;
  algorithm?: EntityTagAlgorithm;
}

export type DecoratorMode = 'class' | 'method' | 'property' | 'parameter';
export type ServerListener = {
  port: number;
  host: string;
};

export type ServerListenerCallback = (error: Error) => void;
export type ApplicationEventMap = {
  ready: ServerListener;
  error: ServerListenerCallback;
  'route:not-found': (ctx: Context) => Promise<void> | void;
  'request:error': (error: any, ctx: Context) => Promise<void> | void;
};
