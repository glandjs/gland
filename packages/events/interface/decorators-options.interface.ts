import { Event, IEventType } from '../types';
// On Decorators Options
export interface EventOnMethodOptions<T extends IEventType = IEventType> {
  /**
   * A transformation function to modify the event before the handler is called.
   */
  transform?: (event: Event<T>) => Event<T>;

  /**
   * Automatically retries the handler if it fails.
   * - max: Maximum retry attempts.
   * - delay: Time (ms) between retries.
   */
  retry?: { max: number; delay: number };
}
export interface EventOnClassOptions {
  pick?: string[] | string;

  omit?: string[] | string;
}

// Emit Decorators Options
export interface EventEmitMethodOptions<D> {
  /**
   * Automatically retries the event publication if the decorated method fails.
   * - max: Maximum retry attempts.
   * - delay: Time (ms) between retries.
   */
  retry?: { max: number; delay: number };
}
