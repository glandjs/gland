import { Event, Listener } from '../types';
export interface EventHook {
  name: string;

  onError?: (error: Error, event: Event<any>, listener: Listener<any>) => Promise<void> | void;
}
