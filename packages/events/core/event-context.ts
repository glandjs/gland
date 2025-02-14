import { EventContextFactory } from '../interface';
import { CtxKey, CtxVal } from '../types';

export interface EventContextData {
  [key: string | symbol]: CtxVal;
}
export class EventContext {
  private data: EventContextData = {};

  get<T extends CtxVal>(key: CtxKey): T | undefined {
    return this.data[key] as T | undefined;
  }

  set<T extends CtxVal>(key: CtxKey, value: T, immutable = false): void {
    this.data[key] = value;
  }
  has(key: CtxKey): boolean {
    return key in this.data;
  }

  delete(key: CtxKey): boolean {
    return delete this.data[key];
  }

  static create(): EventContext {
    return new EventContext();
  }

  saveState(): EventContextData {
    return { ...this.data };
  }

  restoreState(state: EventContextData): void {
    this.data = { ...state };
  }
}

export class ContextFactory implements EventContextFactory {
  create(): EventContext {
    return EventContext.create();
  }
}
