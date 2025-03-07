import { UUID } from '@gland/common';
import { EventType } from '../../enums';

export type EventLiteral = (typeof EventType)[keyof typeof EventType];

type EventMap = {
  [K in EventLiteral]: K | `${K}` | `${EventLiteral}`;
};

export type EventIdentifier<T extends string = string> = `${EventMap[keyof EventMap]}` | T;

export type Event<T extends EventLiteral = EventLiteral, D = any> = {
  type: T;
  data: D;
  correlationId: UUID;
};
