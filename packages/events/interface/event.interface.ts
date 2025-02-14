import { EventContext } from '../core/event-context';

export interface EventContextFactory {
  create(): EventContext;
}
