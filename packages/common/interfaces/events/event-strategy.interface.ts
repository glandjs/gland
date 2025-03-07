import { Callback } from '@medishn/toolkit';
import { Event } from '../../types/';

export interface EventStrategy {
  execute<E extends Event>(event: E, listeners: Callback[]): any;
}
