import { CryptoUUID, Event, EventIdentifier } from '@gland/common';

export class EventMapper {
  static createEvent<T extends string, D>(event: EventIdentifier<T>, data?: D): Event {
    const correlationId = CryptoUUID.generate();
    return {
      correlationId,
      data,
      type: event,
    };
  }
}
