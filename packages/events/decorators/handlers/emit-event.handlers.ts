import { QualifiedEvent } from '@gland/events/types';
import { EventManager } from '../../core/event-manager';
import { EventEmitMethodOptions } from '../../interface';
export namespace EmitHandlers {
  export function classHandler<D>({ data, eventManager, qualified }: { eventManager: EventManager; qualified: QualifiedEvent; data: D }) {
    eventManager.publish(qualified, data);
  }
  export function methodHandler<D>({
    data,
    descriptor,
    eventManager,
    qualified,
    options,
  }: {
    data: D;
    qualified: QualifiedEvent;
    eventManager: EventManager;
    descriptor: PropertyDescriptor;
    options?: EventEmitMethodOptions;
  }) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      let payload = data;
    };
  }
}
