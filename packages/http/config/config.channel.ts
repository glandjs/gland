import { HttpEventCore } from '../adapter';
import { HttpApplicationOptions } from '../interface';
import { ConfigContainer } from './config.container';
import { ObjectInspector } from '@medishn/toolkit/dist/object';

enum ConfigEvent {
  GET = 'get',
  GET_ALL = 'get_all',
  SET = 'set',
  HAS = 'has',
  DELETE = 'delete',
  CLEAR = 'clear',
  INITIALIZE = 'initialize',
  UPDATE = 'update',
  CHANGE = 'change',
  GET_NESTED = 'get_nested',
}

export class ConfigChannel {
  constructor(private channel: HttpEventCore) {
    new ConfigContainer(this);
  }

  onGetNested(handler: (obj: object) => any) {
    this.channel.on(ConfigEvent.GET_NESTED, handler);
  }

  onGet<K extends keyof HttpApplicationOptions>(handler: (key: K) => HttpApplicationOptions[K]) {
    this.channel.on(ConfigEvent.GET, handler);
  }

  onGetAll(handler: () => HttpApplicationOptions) {
    this.channel.on(ConfigEvent.GET_ALL, handler);
  }

  onHas<K extends keyof HttpApplicationOptions>(handler: (key: K) => boolean) {
    this.channel.on(ConfigEvent.HAS, handler);
  }

  onSet<K extends keyof HttpApplicationOptions>(handler: (data: { key: K; value: Partial<HttpApplicationOptions[K]> }) => void) {
    this.channel.on(ConfigEvent.SET, handler);
  }

  onDelete<K extends keyof HttpApplicationOptions>(handler: (key: K) => void) {
    this.channel.on(ConfigEvent.DELETE, handler);
  }

  onClear(handler: () => void) {
    this.channel.on(ConfigEvent.CLEAR, handler);
  }

  onChange<K extends keyof HttpApplicationOptions>(handler: (data: { key: K; value: HttpApplicationOptions[K]; previousValue: HttpApplicationOptions[K] }) => void) {
    this.channel.on(ConfigEvent.CHANGE, handler);
  }

  onInitialize(handler: (options?: HttpApplicationOptions) => void) {
    this.channel.on(ConfigEvent.INITIALIZE, handler);
  }

  onUpdate(handler: (options: Partial<HttpApplicationOptions>) => void) {
    this.channel.on(ConfigEvent.UPDATE, handler);
  }

  get<K extends keyof HttpApplicationOptions>(key: K): HttpApplicationOptions[K] {
    return this.channel.request(ConfigEvent.GET, key, 'first');
  }

  async getAll(): Promise<HttpApplicationOptions> {
    return this.channel.request(ConfigEvent.GET_ALL, null, 'first')!;
  }

  has<K extends keyof HttpApplicationOptions>(key: K): boolean {
    return this.channel.request(ConfigEvent.HAS, key, 'first')!;
  }

  getNested<T extends object = object>(obj: T): ObjectInspector<T> {
    return this.channel.request(ConfigEvent.GET_NESTED, obj, 'first')!;
  }

  set<K extends keyof HttpApplicationOptions>(key: K, value: Partial<HttpApplicationOptions[K]>): void {
    const previousValue = this.get(key);
    this.channel.emit(ConfigEvent.SET, { key, value });
    this.channel.emit(ConfigEvent.CHANGE, { key, value, previousValue });
  }

  delete<K extends keyof HttpApplicationOptions>(key: K): void {
    this.channel.emit(ConfigEvent.DELETE, key);
  }

  clear(): void {
    this.channel.emit(ConfigEvent.CLEAR, null);
  }

  initialize(options?: HttpApplicationOptions): void {
    this.channel.emit(ConfigEvent.INITIALIZE, options);
  }

  update(options: Partial<HttpApplicationOptions>): void {
    this.channel.emit(ConfigEvent.UPDATE, options);
  }
}
